import express from 'express';
import { getMessagesByBooking } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:bookingId', protect, getMessagesByBooking);

export default router;
