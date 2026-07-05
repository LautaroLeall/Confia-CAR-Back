import 'dotenv/config';
import http from 'http';
import dns from 'dns';
import app from './app.js';
import connectDB from './config/db.js';

// Forzar resolución DNS IPv4 primero (evita ECONNREFUSED querySrv en Windows/Node 17+)
dns.setDefaultResultOrder('ipv4first');
import { initSocket } from './sockets/index.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    // 1. Conectar a Base de Datos
    await connectDB();

    // 2. Crear servidor HTTP con Express
    const server = http.createServer(app);

    // 3. Inicializar WebSockets
    initSocket(server);

    // 4. Iniciar escucha
    server.listen(PORT, () => {
        console.log(`✅ Servidor corriendo en el puerto ${PORT} en modo ${process.env.NODE_ENV}`);
    });
};

startServer();
