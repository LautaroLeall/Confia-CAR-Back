import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import axios from 'axios';

// @desc    Registrar un nuevo usuario
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
        }

        // Crear el usuario. El pre-save de Mongoose se encargará de encriptar la contraseña
        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            isEmailVerified: true // Por simplicidad, se autoverifica para el flujo local
        });

        if (user) {
            const token = generateToken(res, user._id);

            res.status(201).json({
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                isAdmin: user.isAdmin,
                token
            });
        } else {
            res.status(400).json({ message: 'Datos de usuario inválidos' });
        }
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// @desc    Iniciar sesión con email y contraseña (Login local)
// @route   POST /api/auth/login
// @access  Public
export const authUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Por favor, ingrese correo y contraseña' });
    }

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            const token = generateToken(res, user._id);

            res.json({
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                isAdmin: user.isAdmin,
                token
            });
        } else {
            res.status(401).json({ message: 'Correo o contraseña incorrectos' });
        }
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// @desc    Loguearse o registrarse con Google Auth
// @route   POST /api/auth/google-auth
// @access  Public
export const googleAuth = async (req, res) => {
    const { tokenId } = req.body; // Credential token de Google en el frontend

    if (!tokenId) {
        return res.status(400).json({ message: 'Falta el token de Google' });
    }

    try {
        // Validar token de ID (JWT) de Google
        const { data } = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${tokenId}`);

        const { email, given_name, family_name, sub, picture } = data;

        if (!email) {
            return res.status(400).json({ message: 'No se pudo obtener el correo de Google' });
        }

        let user = await User.findOne({ email });

        if (!user) {
            // Registrar usuario si no existe
            user = await User.create({
                firstName: given_name || 'Usuario',
                lastName: family_name || 'Google',
                email,
                googleId: sub,
                isEmailVerified: true,
                avatar: picture || ''
            });
        } else {
            // Actualizar googleId si existía registro local pero no por Google
            let needsSave = false;
            if (!user.googleId) {
                user.googleId = sub;
                needsSave = true;
            }
            if (picture && user.avatar !== picture) {
                user.avatar = picture;
                needsSave = true;
            }
            if (needsSave) {
                await user.save();
            }
        }

        const token = generateToken(res, user._id);

        res.json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            isAdmin: user.isAdmin,
            avatar: user.avatar,
            token
        });
    } catch (error) {
        console.error('Error en autenticación con Google:', error.message);
        res.status(401).json({ message: 'Fallo la autenticación con Google' });
    }
};

// @desc    Cerrar sesión de usuario (Limpiar cookies)
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = async (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0)
    });
    res.json({ message: 'Sesión cerrada con éxito' });
};

// @desc    Obtener perfil de usuario logueado
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'Usuario no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener perfil' });
    }
};

// @desc    Actualizar perfil de usuario
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            user.firstName = req.body.firstName || user.firstName;
            user.lastName = req.body.lastName || user.lastName;
            user.avatar = req.body.avatar || user.avatar;
            
            // Si intenta actualizar contraseña
            if (req.body.password) {
                if (req.body.password.length < 6) {
                    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
                }
                user.password = req.body.password;
            }

            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                isAdmin: updatedUser.isAdmin,
                avatar: updatedUser.avatar,
            });
        } else {
            res.status(404).json({ message: 'Usuario no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar perfil' });
    }
};
