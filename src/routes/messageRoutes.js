import express from 'express';
import { getMessagesByBooking, deleteMessagesByBooking } from '../controllers/messageController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:bookingId', protect, getMessagesByBooking);
router.delete('/:bookingId', protect, admin, deleteMessagesByBooking);

export default router;
