const express = require('express');
const router = express.Router();
const NotificationService = require('../Services/NotificationService');
const { validateNotification } = require('../middleware/validation');

// Obtener todas las notificaciones del usuario
router.get('/', async (req, res) => {
  try {
    const { unread } = req.query;
    const result = await NotificationService.getNotifications(
      req.user.userId,
      unread === 'true'
    );

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones',
      error: error.message
    });
  }
});

// Obtener estadísticas de notificaciones
router.get('/stats', async (req, res) => {
  try {
    const result = await NotificationService.getNotificationStats(req.user.userId);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
});

// Marcar notificación como leída
router.put('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const result = await NotificationService.markAsRead(req.user.userId, notificationId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al marcar notificación',
      error: error.message
    });
  }
});

// Marcar todas las notificaciones como leídas
router.put('/read-all', async (req, res) => {
  try {
    const result = await NotificationService.markAllAsRead(req.user.userId);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al marcar notificaciones',
      error: error.message
    });
  }
});

// Eliminar notificación
router.delete('/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const result = await NotificationService.deleteNotification(req.user.userId, notificationId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar notificación',
      error: error.message
    });
  }
});

// Crear notificación manual (solo admin/superadmin)
router.post('/', validateNotification, async (req, res) => {
  try {
    const { type, title, message, userId } = req.body;
    
    const result = await NotificationService.createNotification(
      userId || req.user.userId,
      type,
      title,
      message,
      req.body.metadata || {}
    );

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear notificación',
      error: error.message
    });
  }
});

// Limpiar notificaciones antiguas (solo superadmin)
router.post('/cleanup', async (req, res) => {
  try {
    const result = await NotificationService.cleanOldNotifications();

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al limpiar notificaciones',
      error: error.message
    });
  }
});

module.exports = router;
