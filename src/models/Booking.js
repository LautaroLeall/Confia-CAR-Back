import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
    {
        car: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Car',
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        pickUpDate: {
            type: Date,
            required: true,
        },
        dropOffDate: {
            type: Date,
            required: true,
        },
        location: {
            type: String,
            required: true,
        },
        totalPrice: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending_approval', 'confirmed', 'cancelled', 'paid', 'active', 'completed', 'expired'],
            default: 'pending_approval'
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        preferenceId: {
            type: String, // ID de preferencia de Mercado Pago
            default: '',
        },
        paymentId: {
            type: String, // ID de transacción/pago de Mercado Pago
            default: '',
        },
        paymentResult: {
            mp_payment_id: String,
            mp_status: String,
            mp_status_detail: String
        },
        adminNote: { type: String, default: '' },
        cancelledBy: { type: String, enum: ['user', 'admin'], default: null },
        cancelledAt: { type: Date, default: null },
        confirmedAt: { type: Date, default: null },
        paidAt: { type: Date, default: null },
        chatOpen: { type: Boolean, default: true }
    },
    {
        timestamps: true,
    }
);

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
