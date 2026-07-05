import Car from '../models/Car.js';
import Booking from '../models/Booking.js';

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

        // Si se pasan fechas, filtramos los autos ocupados
        if (pickUpDate && dropOffDate) {
            const overlappingBookings = await Booking.find({
                status: { $in: ['confirmed', 'paid', 'active'] },
                $or: [
                    { pickUpDate: { $lte: new Date(dropOffDate) }, dropOffDate: { $gte: new Date(pickUpDate) } }
                ]
            });
            const busyCarIds = overlappingBookings.map(b => b.car);
            query._id = { $nin: busyCarIds };
        }

        const cars = await Car.find(query);
        res.json(cars);
    } catch (error) {
        console.error('Error al obtener autos:', error);
        res.status(500).json({ message: 'Error al obtener los autos' });
    }
};

// @desc    Obtener un auto por su ID numérico
// @route   GET /api/cars/:id
// @access  Public
export const getCarById = async (req, res) => {
    const { id } = req.params;
    try {
        // Buscamos por el ID numérico compatible con el ruteo del frontend
        const car = await Car.findOne({ id: parseInt(id) });
        if (!car) {
            return res.status(404).json({ message: 'Auto no encontrado' });
        }

        // Buscar reservas activas para este auto (para deshabilitar fechas en el frontend)
        const activeBookings = await Booking.find({
            car: car._id,
            status: { $in: ['confirmed', 'paid', 'active'] },
            dropOffDate: { $gte: new Date() } // Solo reservas futuras o actuales
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
    const { id, name, type, year, seats, fuel, transmission, location, price, description, image } = req.body;

    if (!id || !name || !type || !year || !seats || !fuel || !transmission || !location || !price || !description || !image) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        const carExists = await Car.findOne({ id: parseInt(id) });
        if (carExists) {
            return res.status(400).json({ message: `Ya existe un auto con el ID numérico ${id}` });
        }

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
        const car = await Car.findOne({ id: parseInt(id) });
        if (!car) {
            return res.status(404).json({ message: 'Auto no encontrado' });
        }

        // Actualizar campos
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
        const car = await Car.findOne({ id: parseInt(id) });
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
