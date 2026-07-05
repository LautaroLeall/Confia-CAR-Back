import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Car from '../models/Car.js';
import connectDB from '../config/db.js';

dotenv.config();

const cars = [
    {
        id: 1,
        name: "BMW X5",
        type: "SUV",
        year: 2006,
        seats: 5,
        fuel: "Gasoline",
        transmission: "Automatic",
        location: "Tucuman",
        price: 300,
        description: "El BMW X5 combina lujo, potencia y confort. Ideal para quienes buscan una experiencia de manejo robusta con toques premium.",
        image: "/cars/bmw-x5.png",
    },
    {
        id: 2,
        name: "Toyota Corolla",
        type: "Sedan",
        year: 2021,
        seats: 5,
        fuel: "Gasoline",
        transmission: "Automatic",
        location: "Buenos Aires",
        price: 180,
        description: "El Toyota Corolla es un sedán compacto, económico y confiable. Perfecto para recorridos urbanos o viajes largos sin preocuparse por el consumo.",
        image: "/cars/corolla.png",
    },
    {
        id: 3,
        name: "Peugeot 2008",
        type: "SUV",
        year: 2022,
        seats: 5,
        fuel: "Gasoline",
        transmission: "Manual",
        location: "Tucuman",
        price: 150,
        description: "El Peugeot 2008 es un SUV urbano moderno, con un diseño elegante y gran eficiencia en consumo. Ideal para quienes buscan confort y practicidad.",
        image: "/cars/peugeot-2008.png",
    },
    {
        id: 4,
        name: "Ford Ranger",
        type: "Pickup",
        year: 2022,
        seats: 4,
        fuel: "Diesel",
        transmission: "Manual",
        location: "Cordoba",
        price: 240,
        description: "La Ford Ranger ofrece fuerza, espacio y tecnología. Ideal para viajes familiares o trabajo pesado sin renunciar al confort.",
        image: "/cars/ford-ranger.png",
    },
    {
        id: 5,
        name: "Chevrolet Camaro",
        type: "Coupe",
        year: 2022,
        seats: 4,
        fuel: "Gasoline",
        transmission: "Manual",
        location: "Cordoba",
        price: 250,
        description: "El Chevrolet Camaro es pura adrenalina. Un deportivo potente con diseño agresivo y respuesta precisa para los amantes de la velocidad.",
        image: "/cars/camaro.png",
    },
    {
        id: 6,
        name: "Peugeot 208",
        type: "Hatchback",
        year: 2024,
        seats: 5,
        fuel: "Gasoline",
        transmission: "Automatic",
        location: "Tucuman",
        price: 200,
        description: "El Peugeot 208 se destaca por su diseño moderno y tecnología eficiente. Compacto y ágil, ideal para la ciudad con gran estilo europeo.",
        image: "/cars/peugeot-208.png",
    },
    {
        id: 7,
        name: "Tesla Model S",
        type: "Sedan",
        year: 2024,
        seats: 3,
        fuel: "Electric",
        transmission: "Automatic",
        location: "Buenos Aires",
        price: 330,
        description: "El Tesla Model S redefine la conducción eléctrica. Silencioso, elegante y cargado de tecnología, ideal para un manejo moderno y ecológico.",
        image: "/cars/tesla-models.png",
    },
    {
        id: 8,
        name: "Jeep Wrangler",
        type: "SUV",
        year: 2023,
        seats: 4,
        fuel: "Gasoline",
        transmission: "Manual",
        location: "Buenos Aires",
        price: 250,
        description: "El Jeep Wrangler es la mejor opción para aventuras off-road. Su diseño resistente y tracción te llevan a cualquier lugar con estilo.",
        image: "/cars/jeep-wrangler.png",
    },
    {
        id: 9,
        name: "Audi Q5",
        type: "SUV",
        year: 2023,
        seats: 5,
        fuel: "Gasoline",
        transmission: "Automatic",
        location: "Cordoba",
        price: 270,
        description: "El Audi Q5 destaca por su confort y diseño sofisticado. Una SUV equilibrada con gran performance y acabados premium.",
        image: "/cars/audi-q5.png",
    },
    {
        id: 10,
        name: "Volkswagen Suran",
        type: "Minivan",
        year: 2023,
        seats: 5,
        fuel: "Gasoline",
        transmission: "Manual",
        location: "Tucuman",
        price: 140,
        description: "El Volkswagen Suran es práctico, familiar y eficiente. Ideal para quienes buscan espacio y comodidad en trayectos largos o cortos.",
        image: "/cars/volkswagen-suran.png",
    },
    {
        id: 11,
        name: "BMW M3",
        type: "Sedan",
        year: 2023,
        seats: 5,
        fuel: "Gasoline",
        transmission: "Automatic",
        location: "Buenos Aires",
        price: 280,
        description: "El BMW M3 es sinónimo de deportividad y precisión. Combina lujo, potencia y tecnología en un sedán de alto rendimiento.",
        image: "/cars/bmw-m3.png",
    },
];

const seedData = async () => {
    try {
        await connectDB();

        // Limpiar autos existentes
        await Car.deleteMany();
        console.log('🗑️ Autos anteriores eliminados.');

        // Insertar nuevos autos
        await Car.insertMany(cars);
        console.log('✅ Base de datos poblada con 11 autos.');

        mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error(`❌ Error al poblar base de datos: ${error.message}`);
        process.exit(1);
    }
};

seedData();
