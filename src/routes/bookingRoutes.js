import express from 'express';
import { createBooking, createMPPreference, mpWebhook, getMyBookings, getMyPayments, deleteBooking, getBookingById } from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Crear reserva / Cancelar reserva
router.route('/')
    .post(protect, createBooking);

// Mercado Pago
router.post('/mp-preference', protect, createMPPreference);
router.post('/webhook', mpWebhook); // Público para recibir notificaciones de Mercado Pago

// Listados por usuario
router.get('/my-bookings', protect, getMyBookings);
router.get('/my-payments', protect, getMyPayments);

// Rutas con parámetros
router.route('/:id')
    .get(protect, getBookingById)
    .delete(protect, deleteBooking);

export default router;
