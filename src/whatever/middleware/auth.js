const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // Para desarrollo: permitir pasar sin token si está en modo desarrollo
  if (process.env.NODE_ENV !== 'production' && !token) {
    console.log('MODO DESARROLLO: Autenticación deshabilitada temporalmente');
    // Set a dummy user for development
    req.user = {
      userId: 3, // ID del estudiante de prueba
      documentNumber: '1000000003',
      role: 'student',
      email: 'waosmanxd123@gmail.com'
    };
    return next();
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de autenticación no proporcionado'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }

    req.user = decoded;
    next();
  });
};

module.exports = { authenticateToken };
