import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { registerChatHandlers } from './chat.socket.js';

let io;

export const initSocket = (httpServer) => {
    const allowedOrigins = [
        'https://confia-car-renta.vercel.app',
        process.env.FRONTEND_URL,
        'http://localhost:5173',
        'http://localhost:3000'
    ].filter(Boolean);

    io = new Server(httpServer, {
        cors: {
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);
                if (
                    allowedOrigins.includes(origin) ||
                    origin.endsWith('.vercel.app') ||
                    origin.includes('localhost')
                ) {
                    return callback(null, true);
                }
                return callback(null, true);
            },
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Middleware de autenticación para Sockets
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token) {
                return next(new Error('No autorizado: Token faltante'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id; // Guardamos el ID del usuario en el socket
            return next();
        } catch (err) {
            console.error('Socket authentication error:', err.message);
            return next(new Error('No autorizado: Token inválido'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Cliente conectado al socket. ID Usuario: ${socket.userId}`);

        // Registrar handlers de eventos de chat
        registerChatHandlers(io, socket);

        socket.on('disconnect', () => {
            console.log(`🔌 Cliente desconectado. ID Usuario: ${socket.userId}`);
        });
    });

    return io;
};

export const getIO = () => io;
