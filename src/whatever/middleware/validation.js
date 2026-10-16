const { body, validationResult } = require('express-validator');

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: errors.array()
    });
  }
  next();
};

// Login validation
const validateLogin = [
  body('document_number')
    .notEmpty().withMessage('El número de documento es requerido')
    .isString().withMessage('El número de documento debe ser texto'),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('role')
    .notEmpty().withMessage('El rol es requerido')
    .isIn(['student', 'admin', 'superadmin']).withMessage('Rol inválido'),
  validateRequest
];

// OTP validation
const validateOTP = [
  body('otp')
    .notEmpty().withMessage('El código OTP es requerido')
    .isLength({ min: 6, max: 6 }).withMessage('El código OTP debe tener 6 dígitos')
    .isNumeric().withMessage('El código OTP debe ser numérico'),
  validateRequest
];

// Student registration validation
const validateStudentRegistration = [
  body('document_number')
    .notEmpty().withMessage('El número de documento es requerido')
    .isString().withMessage('El número de documento debe ser texto'),
  body('name')
    .notEmpty().withMessage('El nombre es requerido')
    .isString().withMessage('El nombre debe ser texto'),
  body('email')
    .notEmpty().withMessage('El correo es requerido')
    .isEmail().withMessage('El correo debe ser válido'),
  body('phone')
    .notEmpty().withMessage('El teléfono es requerido')
    .isString().withMessage('El teléfono debe ser texto'),
  body('program')
    .notEmpty().withMessage('El programa es requerido')
    .isString().withMessage('El programa debe ser texto'),
  body('semester')
    .notEmpty().withMessage('El semestre es requerido')
    .isInt({ min: 1, max: 10 }).withMessage('El semestre debe estar entre 1 y 10'),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  validateRequest
];

// Admin registration validation
const validateAdminRegistration = [
  body('document_number')
    .notEmpty().withMessage('El número de documento es requerido')
    .isString().withMessage('El número de documento debe ser texto'),
  body('name')
    .notEmpty().withMessage('El nombre es requerido')
    .isString().withMessage('El nombre debe ser texto'),
  body('email')
    .notEmpty().withMessage('El correo es requerido')
    .isEmail().withMessage('El correo debe ser válido'),
  body('phone')
    .notEmpty().withMessage('El teléfono es requerido')
    .isString().withMessage('El teléfono debe ser texto'),
  body('password')
    .notEmpty().withMessage('La contraseña es requerido')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
  validateRequest
];

// Enrollment validation
const validateEnrollment = [
  body('course_id')
    .notEmpty().withMessage('El ID del curso es requerido')
    .isInt().withMessage('El ID del curso debe ser un número entero'),
  validateRequest
];

// Curriculum validation
const validateCurriculum = [
  body('program')
    .notEmpty().withMessage('El programa es requerido')
    .isString().withMessage('El programa debe ser texto'),
  body('version')
    .notEmpty().withMessage('La versión es requerida')
    .isString().withMessage('La versión debe ser texto'),
  body('total_credits')
    .notEmpty().withMessage('Los créditos totales son requeridos')
    .isInt({ min: 1 }).withMessage('Los créditos totales deben ser un número positivo'),
  body('duration_semesters')
    .notEmpty().withMessage('La duración en semestres es requerida')
    .isInt({ min: 1 }).withMessage('La duración debe ser un número positivo'),
  validateRequest
];

// Subject validation
const validateSubject = [
  body('code')
    .notEmpty().withMessage('El código es requerido')
    .isString().withMessage('El código debe ser texto'),
  body('name')
    .notEmpty().withMessage('El nombre es requerido')
    .isString().withMessage('El nombre debe ser texto'),
  body('credits')
    .notEmpty().withMessage('Los créditos son requeridos')
    .isInt({ min: 1, max: 6 }).withMessage('Los créditos deben estar entre 1 y 6'),
  body('type')
    .notEmpty().withMessage('El tipo es requerido')
    .isIn(['mandatory', 'elective', 'optional']).withMessage('Tipo inválido'),
  body('semester')
    .notEmpty().withMessage('El semestre es requerido')
    .isInt({ min: 1, max: 10 }).withMessage('El semestre debe estar entre 1 y 10'),
  validateRequest
];

// Notification validation
const validateNotification = [
  body('type')
    .notEmpty().withMessage('El tipo es requerido')
    .isIn(['info', 'warning', 'error', 'success']).withMessage('Tipo inválido'),
  body('title')
    .notEmpty().withMessage('El título es requerido')
    .isString().withMessage('El título debe ser texto'),
  body('message')
    .notEmpty().withMessage('El mensaje es requerido')
    .isString().withMessage('El mensaje debe ser texto'),
  validateRequest
];

// PDF report validation
const validatePDFReport = [
  body('studentId')
    .optional()
    .isInt().withMessage('El ID del estudiante debe ser un número entero'),
  body('curriculumId')
    .optional()
    .isInt().withMessage('El ID de la malla debe ser un número entero'),
  body('program')
    .optional()
    .isString().withMessage('El programa debe ser texto'),
  body('semester')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('El semestre debe estar entre 1 y 10'),
  validateRequest
];

// File generation validation
const validateFileGeneration = [
  body('program')
    .optional()
    .isString().withMessage('El programa debe ser texto'),
  body('semester')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('El semestre debe estar entre 1 y 10'),
  validateRequest
];

// Custom Excel validation
const validateCustomExcel = [
  body('data')
    .notEmpty().withMessage('Los datos son requeridos')
    .isArray().withMessage('Los datos deben ser un array'),
  body('sheetName')
    .optional()
    .isString().withMessage('El nombre de la hoja debe ser texto'),
  body('columns')
    .notEmpty().withMessage('Las columnas son requeridas')
    .isArray().withMessage('Las columnas deben ser un array'),
  validateRequest
];

module.exports = {
  validateRequest,
  validateLogin,
  validateOTP,
  validateStudentRegistration,
  validateAdminRegistration,
  validateEnrollment,
  validateCurriculum,
  validateSubject,
  validateNotification,
  validatePDFReport,
  validateFileGeneration,
  validateCustomExcel
};
