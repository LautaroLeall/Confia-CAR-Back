# ⚙️ ConfiaCAR - API REST & WebSockets Backend

Backend escalable, seguro y en tiempo real desarrollado para la plataforma de alquiler de vehículos premium **ConfiaCAR**.
Provee la API REST completa, integración con **Mercado Pago**, WebSockets con **Socket.io** para chat entre cliente y administrador, y la lógica de negocio para la gestión de flota, reservas y usuarios.

> **El motor de alta performance que impulsa tu próximo viaje.**

---

## 🌐 Ver API Online

[![ConfiaCAR Backend](https://img.shields.io/badge/ConfiaCAR%20Backend-2563eb?style=for-the-badge&logo=render&logoColor=white)](https://confia-car-api.onrender.com)

---

## 📌 Características Principales

- ✅ **Autenticación JWT & Google OAuth 2.0**  
  Inicio de sesión seguro mediante credenciales encriptadas con **Bcryptjs** y tokens de sesión JWT. Compatible con autenticación mediante **Google Sign-In**.

- ✅ **Flujo Completo de Alquiler y Reservas**  
  Gestión estricta del ciclo de vida de la reserva:  
  `Pendiente de Aprobación` ➔ `Confirmada` ➔ `Pagada` ➔ `En Uso / Retirada` ➔ `Completada / Devuelta`.

- ✅ **Pagos Seguros con Mercado Pago**  
  Integración con la SDK Oficial de **Mercado Pago** (`mercadopago`). Generación de preferencias de pago en pesos argentinos (ARS) y procesamiento automático de Webhooks de confirmación en tiempo real.

- ✅ **Chat en Tiempo Real (Socket.io)**  
  Salas de chat privadas por reserva (`booking:id`) en tiempo real mediante **WebSockets**. Permite la comunicación entre cliente y soporte/administrador con historial persistente en MongoDB y soporte de modo solo lectura al finalizar el alquiler.

- ✅ **Panel Administrativo (RBAC - Role Based Access Control)**  
  Controladores dedicados para administradores con estadísticas de ingresos, gestión de usuarios, creación/edición de autos, bloqueo/activación de disponibilidad y validación de fecha mínima para retiro de vehículos.

- ✅ **Normalización de Fechas UTC & Zonas Horarias**  
  Manejo preciso de fechas de alquiler a las 12:00:00 UTC para evitar desfasajes por zonas horarias (UTC-3 Argentina) en reservas y calendarios de disponibilidad.

---

## 🛠️ Tecnologías Utilizadas

- **Node.js & Express** _(Servidor web asíncrono y modular)_
- **MongoDB & Mongoose** _(Base de datos NoSQL para gestión de documentos de reservas, usuarios y autos)_
- **Socket.io** _(Comunicación bidireccional mediante WebSockets en tiempo real)_
- **Mercado Pago SDK** _(Procesamiento de pagos y pasarela de checkout)_
- **Bcryptjs & JSON Web Tokens (JWT)** _(Seguridad criptográfica de contraseñas y autenticación de endpoints)_
- **CORS & Helmet** _(Seguridad en cabeceras HTTP y políticas de orígenes cruzados)_

---

## 📂 Estructura del Proyecto Backend

```text
/Backend/src
├── config
│   ├── db.js                 # (Conexión a MongoDB con Mongoose)
│   └── mercadopago.js        # (Inicialización de credenciales Mercado Pago)
│
├── controllers
│   ├── adminController.js    # (Métricas, gestión de flota y aprobación de reservas)
│   ├── authController.js     # (Registro, login, Google Auth y perfil de usuario)
│   ├── bookingController.js  # (Creación de reservas, preferencias MP y webhooks)
│   ├── carController.js      # (Catálogo de autos, búsqueda por ID/ObjectId y fechas ocupadas)
│   └── messageController.js  # (Historial de chat y eliminación de mensajes por reserva)
│
├── middleware
│   └── authMiddleware.js     # (Protección JWT: protect e isAdmin)
│
├── models
│   ├── Booking.js            # (Esquema de reservas, estados, total y fechas)
│   ├── Car.js                # (Esquema de vehículos, fotos, características y tarifa)
│   ├── Message.js            # (Esquema de mensajes de chat en vivo)
│   └── User.js               # (Esquema de usuarios y roles)
│
├── routes
│   ├── adminRoutes.js        # (Rutas protegidas para Administradores)
│   ├── authRoutes.js         # (Rutas de autenticación y perfil)
│   ├── bookingRoutes.js      # (Rutas de reservas y Mercado Pago)
│   ├── carRoutes.js          # (Rutas públicas de catálogo de autos)
│   └── messageRoutes.js      # (Rutas del historial de chat)
│
├── sockets
│   └── chat.socket.js        # (Manejadores de eventos WebSocket para Socket.io)
│
├── utils
│   └── generateToken.js      # (Generador de tokens JWT)
│
├── app.js                    # (Configuración Express, middlewares y rutas)
└── index.js                  # (Punto de entrada, servidor HTTP y Socket.io)
```

---

## 🚀 Instalación y Uso Local

### 1️⃣ Clonar el repositorio

```bash
git clone https://github.com/LautaroLeall/Confia-CAR-Back.git
```

### 2️⃣ Instalar dependencias

```bash
npm install
```

### 3️⃣ Variables de Entorno (.env)

Crea un archivo `.env` en la raíz de `/Backend` con la siguiente estructura:

```env
PORT=5000
FRONTEND_URL=vercel_url_del_frontend
BACKEND_URL=render_url_del_backend
NODE_ENV=development

# MONGO DB
MONGODB_USERNAME=username
MONGODB_PASSWORD=password
MONGO_URI=mongodb+srv://username:

# MERCADO PAGO
MP_ACCESS_TOKEN=access_token_from_mercadopago
MP_PUBLIC_KEY=public_key_from_mercadopago
MP_CLIENT_ID=client_id_from_mercadopago
MP_CLIENT_SECRET=client_secret_from_mercadopago

# GOOGLE AUTH (Para verificar el token en el backend)
GOOGLE_CLIENT_ID=client_id_from_google
GOOGLE_CLIENT_SECRET=client_secret_from_google

# JWT
JWT_SECRET=super_secret_jwt_key_confiacar_dev_2026
```

### 4️⃣ Iniciar el servidor

```bash
# Modo desarrollo (Nodemon)
npm run dev

# Modo producción
npm start
```

---

## 🔗 Principales Endpoints de la API

### 🔐 Autenticación (`/api/auth`)

- `POST /api/auth/register` - Registro de nuevos usuarios
- `POST /api/auth/login` - Inicio de sesión tradicional
- `POST /api/auth/google-auth` - Autenticación con Google OAuth
- `POST /api/auth/logout` - Cierre de sesión

### 🚗 Vehículos (`/api/cars`)

- `GET /api/cars` - Obtener catálogo de autos (con filtro por ubicación, tipo y fechas)
- `GET /api/cars/:id` - Obtener detalle de auto por ObjectId o ID numérico
- `POST /api/cars` - Registrar nuevo auto (Admin)
- `PUT /api/cars/:id` - Actualizar auto o disponibilidad (Admin)
- `DELETE /api/cars/:id` - Eliminar auto (Admin)

### 📅 Reservas & Pagos (`/api/bookings`)

- `POST /api/bookings` - Crear nueva solicitud de reserva
- `POST /api/bookings/mp-preference` - Crear preferencia de pago en Mercado Pago
- `POST /api/bookings/webhook` - Webhook público para notificaciones de pago
- `GET /api/bookings/my-bookings` - Mis reservas registradas
- `GET /api/bookings/my-payments` - Mis pagos realizados

### 💬 Chat (`/api/messages`)

- `GET /api/messages/:bookingId` - Obtener historial de chat de una reserva
- `DELETE /api/messages/:bookingId` - Eliminar historial de chat (Admin)

### 🛡️ Administración (`/api/admin`)

- `GET /api/admin/dashboard` - Métricas de ganancias, autos y reservas
- `GET /api/admin/bookings` - Lista global de reservas
- `PUT /api/admin/bookings/:id/confirm` - Confirmar reserva
- `PUT /api/admin/bookings/:id/pay` - Marcar reserva como pagada
- `PUT /api/admin/bookings/:id/pickup` - Marcar auto como retirado por el cliente
- `PUT /api/admin/bookings/:id/complete` - Marcar auto como devuelto (Finalizar)

---
