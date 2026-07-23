import mongoose from 'mongoose';
import { Preference, Payment } from 'mercadopago';
import mpClient from '../config/mercadopago.js';
import Booking from '../models/Booking.js';
import Car from '../models/Car.js';

// Auxiliar para calcular la cantidad de días entre dos fechas (cadenas YYYY-MM-DD)
const calculateRentalDays = (startDateStr, endDateStr) => {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1; // Mínimo 1 día
};

// @desc    Crear una reserva temporal en estado pendiente
// @route   POST /api/bookings
// @access  Private
export const createBooking = async (req, res) => {
    const { carId, pickUpDate, dropOffDate, location } = req.body;

    if (!carId || !pickUpDate || !dropOffDate || !location) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    try {
        // Buscar el auto en la BD por ObjectId o ID numérico
        let car = null;
        if (mongoose.Types.ObjectId.isValid(carId)) {
            car = await Car.findById(carId);
        }
        if (!car && /^\d+$/.test(String(carId))) {
            car = await Car.findOne({ id: parseInt(carId, 10) });
        }
        if (!car) {
            return res.status(404).json({ message: 'Vehículo no encontrado' });
        }

        // Verificar si el auto ya está reservado en esas fechas
        const overlappingBookings = await Booking.find({
            car: car._id,
            status: { $in: ['confirmed', 'paid', 'active'] },
            $or: [
                { pickUpDate: { $lte: new Date(dropOffDate) }, dropOffDate: { $gte: new Date(pickUpDate) } }
            ]
        });

        if (overlappingBookings.length > 0) {
            return res.status(400).json({ message: 'El vehículo no está disponible en las fechas seleccionadas' });
        }

        // Calcular precio total
        const days = calculateRentalDays(pickUpDate, dropOffDate);
        const totalPrice = days * car.price;

        // Parsear fechas a mediodía UTC (12:00) para evitar desfasaje de zona horaria (UTC-3)
        const parseDateStringUTC = (str) => {
            if (!str) return new Date();
            const dateStr = typeof str === 'string' ? str.split('T')[0] : '';
            if (dateStr.length === 10) {
                return new Date(`${dateStr}T12:00:00.000Z`);
            }
            return new Date(str);
        };

        const booking = await Booking.create({
            car: car._id,
            user: req.user._id,
            pickUpDate: parseDateStringUTC(pickUpDate),
            dropOffDate: parseDateStringUTC(dropOffDate),
            location,
            totalPrice,
            status: 'pending_approval',
            paymentStatus: 'pending',
            chatOpen: false
        });

        // Retornar la reserva creada poblada con datos del auto
        const populatedBooking = await Booking.findById(booking._id).populate('car');
        res.status(201).json(populatedBooking);
    } catch (error) {
        console.error('Error al crear reserva:', error);
        res.status(500).json({ message: 'Error interno al registrar la reserva' });
    }
};

// @desc    Generar preferencia de pago de Mercado Pago vinculada a la reserva
// @route   POST /api/bookings/mp-preference
// @access  Private
export const createMPPreference = async (req, res) => {
    const { bookingId } = req.body;

    if (!bookingId) {
        return res.status(400).json({ message: 'Falta el ID de la reserva' });
    }

    try {
        const booking = await Booking.findById(bookingId).populate('car').populate('user', 'email firstName lastName');

        if (!booking) {
            return res.status(404).json({ message: 'Reserva no encontrada' });
        }

        // Verificar pertenencia
        if (booking.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        // Solo permitir pago si el admin ya confirmó
        if (booking.status !== 'confirmed') {
            return res.status(400).json({ message: 'La reserva aún no ha sido confirmada por el administrador' });
        }

        const preferenceClient = new Preference(mpClient);

        let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
        if (frontendUrl.endsWith('/')) {
            frontendUrl = frontendUrl.slice(0, -1);
        }

        const preferenceBody = {
            items: [
                {
                    id: (booking.car?.id || booking.car?._id || '1').toString(),
                    title: `Alquiler de ${booking.car?.name || 'Auto'}`,
                    quantity: 1,
                    unit_price: Number(booking.totalPrice),
                    currency_id: 'ARS',
                }
            ],
            back_urls: {
                success: `${frontendUrl}/mireservas?status=success`,
                failure: `${frontendUrl}/mireservas?status=failure`,
                pending: `${frontendUrl}/mireservas?status=pending`
            },
            external_reference: booking._id.toString()
        };

        // Mercado Pago exige que back_urls sea HTTPS para permitir auto_return
        if (frontendUrl.startsWith('https')) {
            preferenceBody.auto_return = 'approved';
        }

        console.log('--- ENVIANDO PREFERENCE MP ---', JSON.stringify(preferenceBody, null, 2));

        // Si tenemos url de backend externa configurada para webhooks, la agregamos
        if (process.env.BACKEND_URL) {
            preferenceBody.notification_url = `${process.env.BACKEND_URL}/api/bookings/webhook`;
        }

        const preference = await preferenceClient.create({ body: preferenceBody });

        // Guardar el preferenceId en la reserva
        booking.preferenceId = preference.id;
        await booking.save();

        res.json({
            preferenceId: preference.id,
            initPoint: preference.init_point,
            sandboxInitPoint: preference.sandbox_init_point,
        });
    } catch (error) {
        console.error('Error al crear preferencia MP:', error);
        res.status(500).json({ message: 'Error al procesar la preferencia con Mercado Pago' });
    }
};

// @desc    Webhook asíncrono para confirmaciones de pago de Mercado Pago
// @route   POST /api/bookings/webhook
// @access  Public
export const mpWebhook = async (req, res) => {
    try {
        const { type, data } = req.body;

        if (type !== 'payment') {
            return res.status(200).json({ message: 'Notificación ignorada (no es tipo payment)' });
        }

        const paymentId = data?.id;
        if (!paymentId) {
            return res.status(400).json({ message: 'ID de pago no especificado' });
        }

        // Consultar detalles del pago a la API de Mercado Pago
        const paymentClient = new Payment(mpClient);
        const paymentInfo = await paymentClient.get({ id: paymentId });

        const bookingId = paymentInfo.external_reference;
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ message: 'Reserva no encontrada para el external_reference dado' });
        }

        booking.paymentId = paymentInfo.id.toString();
        booking.paymentResult = {
            mp_payment_id: paymentInfo.id.toString(),
            mp_status: paymentInfo.status,
            mp_status_detail: paymentInfo.status_detail
        };

        if (paymentInfo.status === 'approved') {
            if (booking.status !== 'paid' && booking.status !== 'active' && booking.status !== 'completed') {
                booking.paymentStatus = 'approved';
                booking.status = 'paid';
                booking.paidAt = new Date();
            }
        } else if (paymentInfo.status === 'rejected' || paymentInfo.status === 'cancelled') {
            booking.paymentStatus = 'rejected';
        } else {
            booking.paymentStatus = 'pending';
        }

        await booking.save();

        console.log(`✅ Webhook MP procesado para reserva ${bookingId} con estado ${paymentInfo.status}`);
        res.status(200).json({ message: 'Webhook procesado correctamente' });
    } catch (error) {
        console.error('Error al procesar webhook de Mercado Pago:', error);
        res.status(500).json({ message: 'Error procesando webhook' });
    }
};

// @desc    Obtener todas las reservas del usuario autenticado
// @route   GET /api/bookings/my-bookings
// @access  Private
export const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({
            user: req.user._id
        }).populate('car').sort({ createdAt: -1 });

        res.json(bookings);
    } catch (error) {
        console.error('Error al obtener reservas:', error);
        res.status(500).json({ message: 'Error al obtener tus reservas' });
    }
};

// @desc    Obtener reservas pagadas y confirmadas del usuario autenticado
// @route   GET /api/bookings/my-payments
// @access  Private
export const getMyPayments = async (req, res) => {
    try {
        const payments = await Booking.find({
            user: req.user._id,
            $or: [
                { paymentStatus: 'approved' },
                { status: { $in: ['paid', 'active', 'completed'] } }
            ]
        }).populate('car').sort({ createdAt: -1 });

        res.json(payments);
    } catch (error) {
        console.error('Error al obtener pagos:', error);
        res.status(500).json({ message: 'Error al obtener tu lista de pagos' });
    }
};

// @desc    Obtener detalles de una reserva específica
// @route   GET /api/bookings/:id
// @access  Private
export const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('car').populate('user', 'firstName lastName email');

        if (!booking) {
            return res.status(404).json({ message: 'Reserva no encontrada' });
        }

        // Solo dueño o admin
        if (booking.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        res.json(booking);
    } catch (error) {
        console.error('Error al obtener reserva:', error);
        res.status(500).json({ message: 'Error interno al obtener reserva' });
    }
};

// @desc    Eliminar una reserva (Cancelar)
// @route   DELETE /api/bookings/:id
// @access  Private
export const deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Reserva no encontrada' });
        }

        // Verificar pertenencia
        if (booking.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        // Solo se puede cancelar si está pendiente o confirmada sin pagar
        if (booking.status !== 'pending_approval' && booking.status !== 'confirmed') {
            return res.status(400).json({ message: 'No se puede cancelar en este estado' });
        }

        // En lugar de borrar de la base de datos, lo marcamos como cancelado por el usuario
        booking.status = 'cancelled';
        booking.cancelledBy = 'user';
        booking.cancelledAt = new Date();
        booking.chatOpen = false;

        await booking.save();
        res.json({ message: 'Reserva cancelada con éxito' });
    } catch (error) {
        console.error('Error al cancelar reserva:', error);
        res.status(500).json({ message: 'Error al cancelar la reserva' });
    }
};
