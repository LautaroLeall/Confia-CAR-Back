import Message from '../models/Message.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';

export const registerChatHandlers = (io, socket) => {
    // Unirse a sala de soporte de la reserva
    socket.on('join_booking', async ({ bookingId }) => {
        if (bookingId) {
            try {
                const booking = await Booking.findById(bookingId);
                if (!booking) return;

                const user = await User.findById(socket.userId);
                if (!user) return;

                // Verificar propiedad o rol admin
                if (booking.user.toString() !== socket.userId && !user.isAdmin) {
                    console.log(`⚠️ Acceso denegado a la sala booking:${bookingId} para usuario ${socket.userId}`);
                    return;
                }

                socket.join(`booking:${bookingId}`);
                console.log(`👤 Usuario se unió a la sala booking:${bookingId}`);
            } catch (error) {
                console.error('Error al unirse a la sala:', error.message);
            }
        }
    });

    // Evento de envío de mensaje de chat
    socket.on('send_message', async (messageData) => {
        const { bookingId, content } = messageData;
        if (bookingId && content) {
            try {
                // Verificar que la reserva existe y el chat está abierto
                const booking = await Booking.findById(bookingId);
                if (!booking) return;
                
                if (!booking.chatOpen) {
                    socket.emit('chat_error', { message: 'El chat está cerrado para esta reserva.' });
                    return;
                }

                // Guardar el mensaje en MongoDB
                const message = await Message.create({
                    booking: bookingId,
                    sender: socket.userId,
                    content: content
                });

                // Recuperar el mensaje guardado poblado con datos del remitente
                const populatedMessage = await Message.findById(message._id)
                    .populate('sender', 'firstName lastName email avatar');

                // Emitir en tiempo real a todos los conectados en la sala
                io.to(`booking:${bookingId}`).emit('receive_message', populatedMessage);
            } catch (error) {
                console.error('Error al guardar mensaje en el socket:', error.message);
            }
        }
    });
};
