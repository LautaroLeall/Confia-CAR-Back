import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { 
    getDashboardStats, 
    getAllBookings, 
    confirmBooking, 
    cancelBooking, 
    completeBooking, 
    getAllUsers, 
    updateUserRole, 
    deleteUser 
} from '../controllers/adminController.js';

const router = express.Router();

// Todas las rutas en este archivo requieren autenticación y rol de administrador
router.use(protect, admin);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Bookings (Gestión)
router.get('/bookings', getAllBookings);
router.put('/bookings/:id/confirm', confirmBooking);
router.put('/bookings/:id/cancel', cancelBooking);
router.put('/bookings/:id/complete', completeBooking);

// Users (Gestión)
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

export default router;
