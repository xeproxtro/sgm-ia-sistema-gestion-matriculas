const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const userRole = req.user.role;
    
    // SuperAdmin tiene acceso global a todo
    if (userRole === 'superadmin') {
      req.user.isSuperAdmin = true;
      return next();
    }
    
    // Verificación estricta de roles para otros usuarios
    if (Array.isArray(allowedRoles)) {
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado: permisos insuficientes para su rol'
        });
      }
    } else {
      if (userRole !== allowedRoles) {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado: no tiene permisos para acceder a este recurso'
        });
      }
    }

    // Marcar que no es superadmin para control adicional
    req.user.isSuperAdmin = false;
    next();
  };
};

// Middleware para modo inspección solo lectura (SuperAdmin)
const inspectionMode = (targetRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Solo SuperAdmin puede usar modo inspección
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado: solo Super Administrador puede usar modo inspección'
      });
    }

    // Marcar la solicitud como modo inspección
    req.inspectionMode = true;
    req.targetRole = targetRole;
    req.readOnly = true;
    
    // Agregar headers para indicar modo solo lectura
    res.setHeader('X-Inspection-Mode', 'true');
    res.setHeader('X-Read-Only', 'true');
    
    next();
  };
};

// Middleware para asegurar que solo superadmin pueda acceder
const superAdminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado'
    });
  }

  if (req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado: solo Super Administrador puede acceder a este recurso'
    });
  }

  next();
};

// Middleware para estudiantes únicamente
const studentOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado'
    });
  }

  if (req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado: solo estudiantes pueden acceder a este recurso'
    });
  }

  next();
};

// Middleware para administradores únicamente
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado: solo administradores pueden acceder a este recurso'
    });
  }

  next();
};

const checkAnyRole = () => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }
    next();
  };
};

module.exports = { checkRole, checkAnyRole, superAdminOnly, studentOnly, adminOnly, inspectionMode };
