const express = require('express');
const router = express.Router();
const { models } = require('../../Model');
const { Student, User, Course, Subject, Queue } = models;
const QueueService = require('../Services/QueueService');
const AuthService = require('../Services/AuthService');

// Get admin dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const totalStudents = await Student.count();
    const totalInQueue = await Queue.count({ where: { status: 'waiting' } });
    const activeStudents = await Queue.count({ where: { status: 'active' } });
    const enrolledStudents = await Student.count({
      where: { academic_status: 'active' }
    });

    const admin = await User.findByPk(req.user.userId);

    res.json({
      success: true,
      admin: admin.toJSON(),
      stats: {
        total_students: totalStudents,
        total_in_queue: totalInQueue,
        active_students: activeStudents,
        enrolled_students: enrolledStudents
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos del dashboard',
      error: error.message
    });
  }
});

// Get all students
router.get('/students', async (req, res) => {
  try {
    const students = await Student.findAll({
      include: [{ model: User, as: 'user' }],
      order: [['student_code', 'ASC']]
    });

    res.json({
      success: true,
      students: students.map(s => ({
        ...s.toJSON(),
        name: s.user?.name || 'N/A'
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estudiantes',
      error: error.message
    });
  }
});

// Add new student
router.post('/students', async (req, res) => {
  try {
    const result = await AuthService.registerUser({
      ...req.body,
      role: 'student'
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al agregar estudiante',
      error: error.message
    });
  }
});

// Get all curricula
router.get('/curricula', async (req, res) => {
  try {
    const { Curriculum } = models;
    const curricula = await Curriculum.findAll({
      where: { is_active: true }
    });

    res.json({
      success: true,
      curricula: curricula.map(c => c.toJSON())
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener mallas curriculares',
      error: error.message
    });
  }
});

// Get all courses
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.findAll({
      include: [{ model: Subject, as: 'subject' }],
      order: [['subject_id', 'ASC']]
    });

    res.json({
      success: true,
      courses: courses.map(c => ({
        ...c.toJSON(),
        subject_code: c.subject?.code,
        subject_name: c.subject?.name
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener cursos',
      error: error.message
    });
  }
});

// Get queue data
router.get('/queue', async (req, res) => {
  try {
    const statistics = await QueueService.getQueueStatistics();
    
    const queue = await Queue.findAll({
      include: [{ model: Student, as: 'student', include: [{ model: User, as: 'user' }] }],
      order: [['batch_number', 'ASC'], ['position_in_batch', 'ASC']]
    });

    res.json({
      success: true,
      statistics,
      queue: queue.map(q => ({
        ...q.toJSON(),
        student_name: q.student?.user?.name || 'N/A'
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos de cola',
      error: error.message
    });
  }
});

// Start queue processing
router.post('/queue/start', async (req, res) => {
  try {
    QueueService.startQueueProcessing();
    res.json({
      success: true,
      message: 'Procesamiento de cola iniciado'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al iniciar cola',
      error: error.message
    });
  }
});

// Stop queue processing
router.post('/queue/stop', async (req, res) => {
  try {
    QueueService.stopQueueProcessing();
    res.json({
      success: true,
      message: 'Procesamiento de cola detenido'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al detener cola',
      error: error.message
    });
  }
});

// Reset queue
router.post('/queue/reset', async (req, res) => {
  try {
    const result = await QueueService.resetQueue();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al reiniciar cola',
      error: error.message
    });
  }
});

// Get monitoring data
router.get('/monitoring', async (req, res) => {
  try {
    const metrics = {
      server_load: Math.floor(Math.random() * 100),
      memory_usage: Math.floor(Math.random() * 1000) + 100,
      memory_total: 2048,
      concurrent_users: Math.floor(Math.random() * 50) + 10,
      max_concurrent: 100,
      response_time: Math.floor(Math.random() * 500) + 50
    };

    const logs = [
      {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: 'Sistema operativo normal'
      },
      {
        timestamp: new Date(Date.now() - 60000).toISOString(),
        level: 'INFO',
        message: 'Usuario autenticado exitosamente'
      }
    ];

    res.json({
      success: true,
      metrics,
      logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos de monitoreo',
      error: error.message
    });
  }
});

// Generate reports
router.post('/reports', async (req, res) => {
  try {
    const { type, period } = req.body;
    
    // This would generate actual reports based on type and period
    const report = {
      type,
      period,
      generated_at: new Date().toISOString(),
      data: {
        total_enrollments: Math.floor(Math.random() * 1000),
        completion_rate: (Math.random() * 100).toFixed(2),
        average_gpa: (Math.random() * 4 + 1).toFixed(2)
      }
    };

    res.json({
      success: true,
      report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte',
      error: error.message
    });
  }
});

// Toggle maintenance mode
router.post('/maintenance', async (req, res) => {
  try {
    const { enabled } = req.body;
    process.env.MAINTENANCE_MODE = enabled ? 'true' : 'false';
    
    res.json({
      success: true,
      message: enabled ? 'Modo mantenimiento activado' : 'Modo mantenimiento desactivado'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al cambiar modo mantenimiento',
      error: error.message
    });
  }
});

module.exports = router;
