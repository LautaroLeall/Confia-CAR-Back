import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/authRoutes.js';
import carRoutes from './routes/carRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

// Orígenes permitidos (Vercel + localhost)
const allowedOrigins = [
    'https://confia-car-renta.vercel.app',
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000'
].filter(Boolean);

// Middlewares
app.use(cors({
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
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);

// Health check (usado por GlobalLoader para detectar si el backend está listo)
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: '¡El backend de Confia-CAR está funcionando! 🚗🚀' });
});

app.get('/api/status', (req, res) => {
    res.json({ status: 'ok', message: '¡El backend de Confia-CAR está funcionando! 🚗🚀' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: '¡El backend de Confia-CAR está funcionando! 🚗🚀' });
});

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Error interno del servidor'
        : err.message || 'Error interno del servidor';

    console.error(`[Error] ${err.stack || err.message}`);

    res.status(status).json({ message });
});

export default app;
