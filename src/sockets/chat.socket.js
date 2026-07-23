import Message from '../models/Message.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';

export const registerChatHandlers = (io, socket) => {
    const handleJoin = async ({ bookingId }) => {
        if (bookingId) {
            try {
                const booking = await Booking.findById(bookingId);
                if (!booking) return;

                const user = await User.findById(socket.userId);
                if (!user) return;

                if (booking.user.toString() !== socket.userId && !user.isAdmin) {
                    console.log(`⚠️ Acceso denegado a la sala booking:${bookingId} para usuario ${socket.userId}`);
                    return;
                }

                socket.join(`booking:${bookingId}`);
                console.log(`👤 Usuario ${socket.userId} se unió a la sala booking:${bookingId}`);
            } catch (error) {
                console.error('Error al unirse a la sala:', error.message);
            }
        }
    };

    const handleSendMessage = async (messageData) => {
        const { bookingId, content } = messageData;
        if (bookingId && content) {
            try {
                const booking = await Booking.findById(bookingId);
                if (!booking) return;

                if (booking.chatOpen === false) {
                    socket.emit('chat_error', { message: 'El chat está cerrado para esta reserva.' });
                    return;
                }

                // Guardar el mensaje en MongoDB
                const message = await Message.create({
                    booking: bookingId,
                    sender: socket.userId,
                    content: content
                });

                const populatedMessage = await Message.findById(message._id)
                    .populate('sender', 'firstName lastName email avatar');

                // Emitir solo un evento de respuesta a la sala
                io.to(`booking:${bookingId}`).emit('receive_message', populatedMessage);

                console.log(`💬 Mensaje enviado en reserva ${bookingId} por ${socket.userId}: "${content}"`);
            } catch (error) {
                console.error('Error al guardar mensaje en el socket:', error.message);
            }
        }
    };

    socket.on('join_booking', handleJoin);
    socket.on('joinRoom', handleJoin);

    socket.on('send_message', handleSendMessage);
    socket.on('sendMessage', handleSendMessage);
};
