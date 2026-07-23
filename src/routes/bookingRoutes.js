import express from 'express';
import { createBooking, createMPPreference, mpWebhook, getMyBookings, getMyPayments, deleteBooking, getBookingById } from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Crear reserva
router.route('/')
    .post(protect, createBooking);

// Mercado Pago
router.post('/mp-preference', protect, createMPPreference);
router.post('/webhook', mpWebhook);

// Listados por usuario — DEBEN ir ANTES de /:id para no ser capturadas
router.get('/my', protect, getMyBookings);   // alias para el frontend
router.get('/my-bookings', protect, getMyBookings);
router.get('/my-payments', protect, getMyPayments);

// Alias PUT para cancelar (compatible con frontend)
router.put('/:id/cancel', protect, deleteBooking);

// Rutas con parámetros — SIEMPRE AL FINAL
router.route('/:id')
    .get(protect, getBookingById)
    .delete(protect, deleteBooking);

export default router;
