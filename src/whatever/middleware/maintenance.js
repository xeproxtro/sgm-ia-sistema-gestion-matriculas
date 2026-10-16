require('dotenv').config();

const maintenanceMode = (req, res, next) => {
  if (process.env.MAINTENANCE_MODE === 'true') {
    // Permitir acceso de lectura a estudiantes para ciertas rutas
    const userRole = req.user?.role;
    const method = req.method;
    const path = req.path;
    
    // Rutas de lectura permitidas para estudiantes durante mantenimiento
    const allowedReadOnlyRoutes = [
      '/api/curriculum/student',
      '/api/curriculum/electives',
      '/api/curriculum/subject/',
      '/api/curriculum/search',
      '/api/curriculum/file/',
      '/api/student/academic-history'
    ];
    
    // Permitir si es estudiante y es una petición GET a ruta permitida
    if (userRole === 'student' && method === 'GET') {
      const isAllowed = allowedReadOnlyRoutes.some(route => path.startsWith(route));
      if (isAllowed) {
        return next();
      }
    }
    
    // Permitir siempre acceso a admin y superadmin
    if (userRole === 'admin' || userRole === 'superadmin') {
      return next();
    }
    
    // Si no hay usuario autenticado (antes de authenticateToken), bloquear
    if (!userRole) {
      return res.status(503).json({
        success: false,
        message: 'El sistema se encuentra en modo mantenimiento',
        maintenanceMessage: process.env.MAINTENANCE_MESSAGE || 'El sistema está en mantenimiento. Por favor intente más tarde.'
      });
    }
    
    return res.status(503).json({
      success: false,
      message: 'El sistema se encuentra en modo mantenimiento',
      maintenanceMessage: process.env.MAINTENANCE_MESSAGE || 'El sistema está en mantenimiento. Por favor intente más tarde.',
      readOnlyAccess: userRole === 'student' ? 'Solo lectura disponible para mallas curriculares' : false
    });
  }
  next();
};

module.exports = { maintenanceMode };
