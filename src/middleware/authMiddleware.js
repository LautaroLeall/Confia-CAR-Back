import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
    let token;

    // Buscar token en cabeceras de autorización o en cookies
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'No autorizado, usuario no encontrado' });
            }

            return next();
        } catch (error) {
            console.error('JWT verification error:', error.message);
            return res.status(401).json({ message: 'No autorizado, token inválido o expirado' });
        }
    }

    return res.status(401).json({ message: 'No autorizado, no se proporcionó ningún token' });
};

const admin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(403).json({ message: 'Prohibido: se requiere rol de administrador' });
    }
};

export { protect, admin };
