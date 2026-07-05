import { MercadoPagoConfig } from 'mercadopago';

// Inicializar el cliente de Mercado Pago con el token de acceso de las variables de entorno
const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || ''
});

export default mpClient;
