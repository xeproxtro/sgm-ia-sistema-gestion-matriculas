const express = require('express');
const router = express.Router();
const QueueService = require('../Services/QueueService');
const { models } = require('../../Model');
const { Queue, Student } = models;

// Add student to queue
router.post('/add', async (req, res) => {
  try {
    const student = await Student.findOne({
      where: { user_id: req.user.userId }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    const result = await QueueService.addToQueue(student.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al añadir a la cola',
      error: error.message
    });
  }
});

// Get queue status for current student
router.get('/status', async (req, res) => {
  try {
    const student = await Student.findOne({
      where: { user_id: req.user.userId }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    const result = await QueueService.getQueueStatus(student.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estado de cola',
      error: error.message
    });
  }
});

// Complete queue entry
router.post('/complete', async (req, res) => {
  try {
    const student = await Student.findOne({
      where: { user_id: req.user.userId }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    const result = await QueueService.completeQueueEntry(student.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al completar entrada de cola',
      error: error.message
    });
  }
});

// Skip queue entry
router.post('/skip', async (req, res) => {
  try {
    const student = await Student.findOne({
      where: { user_id: req.user.userId }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    const result = await QueueService.skipQueueEntry(student.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al saltar entrada de cola',
      error: error.message
    });
  }
});

// Get queue statistics (admin only)
router.get('/statistics', async (req, res) => {
  try {
    const statistics = await QueueService.getQueueStatistics();
    res.json({
      success: true,
      statistics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de cola',
      error: error.message
    });
  }
});

module.exports = router;
