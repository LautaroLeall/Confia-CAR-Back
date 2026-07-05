import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Car from '../models/Car.js';

// @desc    Obtener estadísticas generales para el dashboard
// @route   GET /api/admin/dashboard
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
    try {
        const totalCars = await Car.countDocuments();
        const totalUsers = await User.countDocuments();
        const totalBookings = await Booking.countDocuments();
        
        const paidBookings = await Booking.find({ status: { $in: ['paid', 'active', 'completed'] } });
        const totalRevenue = paidBookings.reduce((acc, booking) => acc + booking.totalPrice, 0);

        const recentBookings = await Booking.find()
            .populate('car', 'name image id')
            .populate('user', 'firstName lastName')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            totalCars,
            totalUsers,
            totalBookings,
            totalRevenue,
            recentBookings
        });
    } catch (error) {
        console.error('Error al obtener stats:', error);
        res.status(500).json({ message: 'Error interno al obtener estadísticas' });
    }
};

// @desc    Obtener todas las reservas con filtros opcionales
// @route   GET /api/admin/bookings
// @access  Private/Admin
export const getAllBookings = async (req, res) => {
    const { status } = req.query;
    try {
        const query = status ? { status } : {};
        const bookings = await Booking.find(query)
            .populate('car', 'name image id type')
            .populate('user', 'firstName lastName email')
            .sort({ createdAt: -1 });

        res.json(bookings);
    } catch (error) {
        console.error('Error al obtener todas las reservas:', error);
        res.status(500).json({ message: 'Error interno' });
    }
};

// @desc    Confirmar una reserva
// @route   PUT /api/admin/bookings/:id/confirm
// @access  Private/Admin
export const confirmBooking = async (req, res) => {
    const { adminNote } = req.body;
    try {
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) {
            return res.status(404).json({ message: 'Reserva no encontrada' });
        }

        if (booking.status !== 'pending_approval') {
            return res.status(400).json({ message: 'Solo se pueden confirmar reservas pendientes' });
        }

        booking.status = 'confirmed';
        booking.confirmedAt = new Date();
        if (adminNote) booking.adminNote = adminNote;

        await booking.save();
        res.json({ message: 'Reserva confirmada con éxito', booking });
    } catch (error) {
        console.error('Error al confirmar reserva:', error);
        res.status(500).json({ message: 'Error interno' });
    }
};

// @desc    Cancelar una reserva (Admin)
// @route   PUT /api/admin/bookings/:id/cancel
// @access  Private/Admin
export const cancelBooking = async (req, res) => {
    const { adminNote } = req.body;
    try {
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) {
            return res.status(404).json({ message: 'Reserva no encontrada' });
        }

        if (['cancelled', 'paid', 'active', 'completed'].includes(booking.status)) {
            return res.status(400).json({ message: 'No se puede cancelar en este estado' });
        }

        booking.status = 'cancelled';
        booking.cancelledBy = 'admin';
        booking.cancelledAt = new Date();
        booking.chatOpen = false; // Se cierra el chat
        if (adminNote) booking.adminNote = adminNote;

        await booking.save();
        res.json({ message: 'Reserva cancelada con éxito', booking });
    } catch (error) {
        console.error('Error al cancelar reserva:', error);
        res.status(500).json({ message: 'Error interno' });
    }
};

// @desc    Marcar reserva como completada manualmente
// @route   PUT /api/admin/bookings/:id/complete
// @access  Private/Admin
export const completeBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) {
            return res.status(404).json({ message: 'Reserva no encontrada' });
        }

        if (booking.status !== 'paid' && booking.status !== 'active') {
            return res.status(400).json({ message: 'Solo se pueden completar reservas pagadas o activas' });
        }

        booking.status = 'completed';
        booking.chatOpen = false;

        await booking.save();
        res.json({ message: 'Reserva marcada como completada', booking });
    } catch (error) {
        console.error('Error al completar reserva:', error);
        res.status(500).json({ message: 'Error interno' });
    }
};

// @desc    Obtener todos los usuarios
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error interno' });
    }
};

// @desc    Actualizar rol de un usuario
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'No puedes cambiar tu propio rol' });
        }

        user.isAdmin = !user.isAdmin;
        await user.save();
        
        res.json({ message: 'Rol de usuario actualizado', isAdmin: user.isAdmin });
    } catch (error) {
        res.status(500).json({ message: 'Error interno' });
    }
};

// @desc    Eliminar un usuario
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        if (user.isAdmin) {
            return res.status(400).json({ message: 'No se puede eliminar a un administrador' });
        }

        await user.deleteOne();
        res.json({ message: 'Usuario eliminado con éxito' });
    } catch (error) {
        res.status(500).json({ message: 'Error interno' });
    }
};
