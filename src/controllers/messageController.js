import Message from '../models/Message.js';
import Booking from '../models/Booking.js';

// @desc    Obtener todo el historial de chat para una reserva específica
// @route   GET /api/messages/:bookingId
// @access  Private
export const getMessagesByBooking = async (req, res) => {
    const { bookingId } = req.params;

    try {
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ message: 'Reserva no encontrada' });
        }

        // Verificar que el usuario pertenece a la reserva o es administrador
        if (booking.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: 'No autorizado para ver este chat' });
        }

        // Buscar mensajes ordenados cronológicamente
        const messages = await Message.find({ booking: bookingId })
            .populate('sender', 'firstName lastName email avatar')
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        console.error('Error al obtener mensajes:', error);
        res.status(500).json({ message: 'Error interno del servidor al recuperar historial' });
    }
};
