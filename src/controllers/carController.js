import mongoose from 'mongoose';
import Car from '../models/Car.js';
import Booking from '../models/Booking.js';

// Helper para buscar un auto tanto por MongoDB _id como por su id numérico (evita el bug de parseInt('6a4e...'))
const findCarByIdOrObjectId = async (id) => {
    let car = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
        car = await Car.findById(id);
    }
    if (!car && /^\d+$/.test(String(id))) {
        car = await Car.findOne({ id: parseInt(id, 10) });
    }
    if (!car) {
        car = await Car.findOne({ id: id });
    }
    return car;
};

// @desc    Obtener todos los autos (con filtro opcional de ubicación)
// @route   GET /api/cars
// @access  Public
export const getCars = async (req, res) => {
    const { location, pickUpDate, dropOffDate } = req.query;
    try {
        const query = {};
        if (location) {
            query.location = { $regex: new RegExp(location, 'i') };
        }

        if (pickUpDate && dropOffDate) {
            const overlappingBookings = await Booking.find({
                status: { $in: ['confirmed', 'paid', 'picked_up', 'active'] },
                $or: [
                    { pickUpDate: { $lte: new Date(dropOffDate) }, dropOffDate: { $gte: new Date(pickUpDate) } }
                ]
            });
            const busyCarIds = overlappingBookings.map(b => b.car);
            query._id = { $nin: busyCarIds };
        }

        const cars = await Car.find(query).lean();

        // Obtener reservas activas/confirmadas/pagadas/retiradas para adjuntar fechas ocupadas
        const activeBookings = await Booking.find({
            status: { $in: ['confirmed', 'paid', 'picked_up', 'active'] },
            dropOffDate: { $gte: new Date() }
        }).select('car pickUpDate dropOffDate status');

        const carsWithBookings = cars.map(car => {
            const carBookings = activeBookings.filter(b => b.car.toString() === car._id.toString());
            return {
                ...car,
                activeBookings: carBookings
            };
        });

        res.json(carsWithBookings);
    } catch (error) {
        console.error('Error al obtener autos:', error);
        res.status(500).json({ message: 'Error al obtener los autos' });
    }
};

// @desc    Obtener un auto por su ID (ObjectId o numérico)
// @route   GET /api/cars/:id
// @access  Public
export const getCarById = async (req, res) => {
    const { id } = req.params;
    try {
        const car = await findCarByIdOrObjectId(id);
        if (!car) {
            return res.status(404).json({ message: 'Auto no encontrado' });
        }

        const activeBookings = await Booking.find({
            car: car._id,
            status: { $in: ['confirmed', 'paid', 'picked_up', 'active'] },
            dropOffDate: { $gte: new Date() }
        }).select('pickUpDate dropOffDate status');

        res.json({ ...car.toObject(), activeBookings });
    } catch (error) {
        console.error('Error al obtener auto por ID:', error);
        res.status(500).json({ message: 'Error al obtener el auto' });
    }
};

// @desc    Crear un nuevo auto (Admin)
// @route   POST /api/cars
// @access  Private/Admin
export const createCar = async (req, res) => {
    const { name, type, year, seats, fuel, transmission, location, price, description, image } = req.body;

    if (!name || !type || !year || !seats || !fuel || !transmission || !location || !price || !description || !image) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        let numericId = req.body.id;
        if (!numericId) {
            const lastCar = await Car.findOne({}).sort({ id: -1 });
            numericId = (lastCar && lastCar.id && !isNaN(lastCar.id)) ? lastCar.id + 1 : Date.now();
        }
        req.body.id = numericId;

        const car = await Car.create(req.body);
        res.status(201).json(car);
    } catch (error) {
        console.error('Error al crear auto:', error);
        res.status(500).json({ message: 'Error al registrar el auto' });
    }
};

// @desc    Actualizar un auto existente (Admin)
// @route   PUT /api/cars/:id
// @access  Private/Admin
export const updateCar = async (req, res) => {
    const { id } = req.params;
    try {
        const car = await findCarByIdOrObjectId(id);
        if (!car) {
            return res.status(404).json({ message: 'Auto no encontrado' });
        }

        Object.assign(car, req.body);
        const updatedCar = await car.save();
        res.json(updatedCar);
    } catch (error) {
        console.error('Error al actualizar auto:', error);
        res.status(500).json({ message: 'Error al actualizar el auto' });
    }
};

// @desc    Eliminar un auto (Admin)
// @route   DELETE /api/cars/:id
// @access  Private/Admin
export const deleteCar = async (req, res) => {
    const { id } = req.params;
    try {
        const car = await findCarByIdOrObjectId(id);
        if (!car) {
            return res.status(404).json({ message: 'Auto no encontrado' });
        }

        await car.deleteOne();
        res.json({ message: 'Auto eliminado con éxito' });
    } catch (error) {
        console.error('Error al eliminar auto:', error);
        res.status(500).json({ message: 'Error al eliminar el auto' });
    }
};
