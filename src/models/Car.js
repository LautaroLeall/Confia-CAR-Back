import mongoose from 'mongoose';

const carSchema = new mongoose.Schema(
    {
        id: {
            type: Number,
            required: true,
            unique: true, // Campo numérico para compatibilidad con el frontend
        },
        name: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
        year: {
            type: Number,
            required: true,
        },
        seats: {
            type: Number,
            required: true,
        },
        fuel: {
            type: String,
            required: true,
        },
        transmission: {
            type: String,
            required: true,
        },
        location: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        image: {
            type: String,
            required: true,
        },
        isAvailable: {
            type: Boolean,
            default: true,
        }
    },
    {
        timestamps: true,
    }
);

const Car = mongoose.model('Car', carSchema);

export default Car;
