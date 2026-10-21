const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const { sequelize, testConnection } = require('./Config/database');
const { syncDatabase } = require('../Model');

// Import routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const adminRoutes = require('./routes/admin');
const superadminRoutes = require('./routes/superadmin');
const queueRoutes = require('./routes/queue');
const enrollmentRoutes = require('./routes/enrollment');
const aiRoutes = require('./routes/ai');
const curriculumRoutes = require('./routes/curriculum');
const notificationRoutes = require('./microservices/NotificationMicroservice').router;
const pdfReportRoutes = require('./microservices/PDFReportMicroservice').router;
const fileGenerationRoutes = require('./microservices/FileGenerationMicroservice').router;

// Import middleware
const { authenticateToken } = require('./middleware/auth');
const { checkRole, superAdminOnly, studentOnly, adminOnly, inspectionMode } = require('./middleware/roles');
const { maintenanceMode } = require('./middleware/maintenance');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.JWT_SECRET || 'sgm-ia-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static files
app.use('/Assets', express.static(path.join(__dirname, './Assets')));
app.use(express.static(path.join(__dirname, '../View')));

// Serve uploaded files (accessible by students during maintenance)
app.use('/uploads', express.static(path.join(__dirname, './uploads')));
app.use('/uploads/reports', express.static(path.join(__dirname, './uploads/reports')));
app.use('/uploads/exports', express.static(path.join(__dirname, './uploads/exports')));

// Health check endpoint for Kubernetes and load balancers
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes - Aislamiento estricto por rol
// SuperAdmin tiene acceso global a todas las rutas
app.use('/api/auth', authRoutes);

// Rutas exclusivas para estudiantes (solo student o superadmin)
app.use('/api/student', authenticateToken, checkRole(['student', 'superadmin']), studentRoutes);

// Rutas exclusivas para administradores (solo admin o superadmin)
app.use('/api/admin', authenticateToken, checkRole(['admin', 'superadmin']), adminRoutes);

// Rutas exclusivas para superadmin (solo superadmin)
app.use('/api/superadmin', authenticateToken, superAdminOnly, superadminRoutes);

// Rutas de estudiantes - accesible por student o superadmin
app.use('/api/student', authenticateToken, checkRole(['student', 'superadmin']), studentRoutes);

// Rutas de cola - accesible por admin y superadmin
app.use('/api/queue', authenticateToken, checkRole(['admin', 'superadmin']), queueRoutes);

// Rutas de matrícula - accesible por student, admin y superadmin
app.use('/api/enrollment', authenticateToken, checkRole(['student', 'admin', 'superadmin']), enrollmentRoutes);

// Rutas de IA - EXCLUSIVO para rol Estudiante (solo student)
app.use('/api/ai', authenticateToken, studentOnly, aiRoutes);

// Rutas de currículum - accesible por student, admin y superadmin
// El middleware de mantenimiento se aplica después de autenticación
app.use('/api/curriculum', authenticateToken, checkRole(['student', 'admin', 'superadmin']), (req, res, next) => {
  maintenanceMode(req, res, next);
}, curriculumRoutes);

// Rutas de notificaciones - accesible por todos los roles autenticados
app.use('/api/notifications', authenticateToken, notificationRoutes);

// Rutas de reportes PDF - accesible por student, admin y superadmin
app.use('/api/reports/pdf', authenticateToken, checkRole(['student', 'admin', 'superadmin']), pdfReportRoutes);

// Rutas de generación de archivos - accesible por admin y superadmin
app.use('/api/reports/files', authenticateToken, checkRole(['admin', 'superadmin']), fileGenerationRoutes);

// Admin queue management routes - solo admin o superadmin
app.use('/api/admin/queue', authenticateToken, checkRole(['admin', 'superadmin']), queueRoutes);

// Serve HTML files for each role - Aislamiento estricto
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../View/login.html'));
});

// Dashboard de estudiante - solo student o superadmin
app.get('/student-dashboard.html', authenticateToken, checkRole(['student', 'superadmin']), (req, res) => {
  res.sendFile(path.join(__dirname, '../View/student-dashboard.html'));
});

// Dashboard de admin - solo admin o superadmin
app.get('/admin-dashboard.html', authenticateToken, checkRole(['admin', 'superadmin']), (req, res) => {
  res.sendFile(path.join(__dirname, '../View/admin-dashboard.html'));
});

// Dashboard de superadmin - solo superadmin
app.get('/superadmin-dashboard.html', authenticateToken, superAdminOnly, (req, res) => {
  res.sendFile(path.join(__dirname, '../View/superadmin-dashboard.html'));
});

// Rutas protegidas para páginas internas de ESTUDIANTE (solo student o superadmin)
app.get('/student/enrollment-process.html', authenticateToken, checkRole(['student', 'superadmin']), (req, res) => {
  res.sendFile(path.join(__dirname, '../View/student/enrollment-process.html'));
});

app.get('/student/ai-schedule.html', authenticateToken, checkRole(['student', 'superadmin']), (req, res) => {
  res.sendFile(path.join(__dirname, '../View/student/ai-schedule.html'));
});

app.get('/student/academic-history.html', authenticateToken, checkRole(['student', 'superadmin']), (req, res) => {
  res.sendFile(path.join(__dirname, '../View/student/academic-history.html'));
});

// Rutas protegidas para páginas internas de ADMINISTRADOR (solo admin o superadmin)
app.get('/admin/students-management.html', authenticateToken, checkRole(['admin', 'superadmin']), (req, res) => {
  res.sendFile(path.join(__dirname, '../View/admin/students-management.html'));
});

app.get('/admin/curricula-management.html', authenticateToken, checkRole(['admin', 'superadmin']), (req, res) => {
  res.sendFile(path.join(__dirname, '../View/admin/curricula-management.html'));
});

app.get('/admin/queue-monitoring.html', authenticateToken, checkRole(['admin', 'superadmin']), (req, res) => {
  res.sendFile(path.join(__dirname, '../View/admin/queue-monitoring.html'));
});

// Rutas protegidas para páginas internas de SUPERADMIN (solo superadmin)
app.get('/superadmin/admin-management.html', authenticateToken, superAdminOnly, (req, res) => {
  res.sendFile(path.join(__dirname, '../View/superadmin/admin-management.html'));
});

app.get('/superadmin/system-maintenance.html', authenticateToken, superAdminOnly, (req, res) => {
  res.sendFile(path.join(__dirname, '../View/superadmin/system-maintenance.html'));
});

app.get('/superadmin/system-audit.html', authenticateToken, superAdminOnly, (req, res) => {
  res.sendFile(path.join(__dirname, '../View/superadmin/system-audit.html'));
});

app.get('/superadmin/portal-inspection.html', authenticateToken, superAdminOnly, (req, res) => {
  res.sendFile(path.join(__dirname, '../View/superadmin/portal-inspection.html'));
});

// Rutas de inspección para SuperAdmin (modo solo lectura)
app.get('/inspection/student/:page', authenticateToken, superAdminOnly, inspectionMode('student'), (req, res) => {
  const page = req.params.page;
  res.sendFile(path.join(__dirname, '../View/student', page + '.html'));
});

app.get('/inspection/admin/:page', authenticateToken, superAdminOnly, inspectionMode('admin'), (req, res) => {
  const page = req.params.page;
  res.sendFile(path.join(__dirname, '../View/admin', page + '.html'));
});

// Root route
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Sync database models
    await syncDatabase(false);
    
    // Start queue processing
    const QueueService = require('./Services/QueueService');
    QueueService.startQueueProcessing();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`SGM-IA Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Maintenance Mode: ${process.env.MAINTENANCE_MODE === 'true' ? 'ACTIVE' : 'INACTIVE'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  const QueueService = require('./Services/QueueService');
  QueueService.stopQueueProcessing();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  const QueueService = require('./Services/QueueService');
  QueueService.stopQueueProcessing();
  process.exit(0);
});

startServer();

module.exports = app;
