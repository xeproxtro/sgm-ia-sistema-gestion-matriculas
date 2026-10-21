/**
 * Microservicio de Notificaciones (Compacto)
 * Contiene: Service, Routes y Script en un solo archivo
 * 
 * Uso como módulo en Express:
 * const NotificationMicroservice = require('./microservices/NotificationMicroservice');
 * app.use('/api/notifications', NotificationMicroservice.router);
 * 
 * Uso como script independiente:
 * node src/whatever/microservices/NotificationMicroservice.js
 */

const express = require('express');
const { models } = require('../../Model');
const { Student, User, SystemLogs } = models;
require('dotenv').config();

// ==========================================
// PARTE 1: SERVICE (Lógica de Negocio)
// ==========================================

class NotificationService {
  constructor() {
    this.notifications = new Map();
    this.maxNotifications = 100;
  }

  async createNotification(userId, type, title, message, metadata = {}) {
    try {
      const notification = {
        id: this.generateId(),
        userId,
        type,
        title,
        message,
        metadata,
        createdAt: new Date(),
        read: false
      };

      const userNotifications = this.notifications.get(userId) || [];
      userNotifications.unshift(notification);
      
      if (userNotifications.length > this.maxNotifications) {
        userNotifications.pop();
      }
      
      this.notifications.set(userId, userNotifications);

      await this.logNotification(notification);

      return {
        success: true,
        notification
      };
    } catch (error) {
      console.error('Error al crear notificación:', error);
      return {
        success: false,
        message: 'Error al crear notificación',
        error: error.message
      };
    }
  }

  async getNotifications(userId, unreadOnly = false) {
    try {
      const userNotifications = this.notifications.get(userId) || [];
      
      const filtered = unreadOnly 
        ? userNotifications.filter(n => !n.read)
        : userNotifications;

      return {
        success: true,
        notifications: filtered,
        total: filtered.length,
        unread: userNotifications.filter(n => !n.read).length
      };
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      return {
        success: false,
        message: 'Error al obtener notificaciones',
        error: error.message
      };
    }
  }

  async markAsRead(userId, notificationId) {
    try {
      const userNotifications = this.notifications.get(userId) || [];
      const notification = userNotifications.find(n => n.id === notificationId);

      if (!notification) {
        return {
          success: false,
          message: 'Notificación no encontrada'
        };
      }

      notification.read = true;
      notification.readAt = new Date();

      return {
        success: true,
        notification
      };
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      return {
        success: false,
        message: 'Error al marcar notificación',
        error: error.message
      };
    }
  }

  async markAllAsRead(userId) {
    try {
      const userNotifications = this.notifications.get(userId) || [];
      
      userNotifications.forEach(n => {
        n.read = true;
        n.readAt = new Date();
      });

      return {
        success: true,
        message: 'Todas las notificaciones marcadas como leídas',
        count: userNotifications.length
      };
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
      return {
        success: false,
        message: 'Error al marcar notificaciones',
        error: error.message
      };
    }
  }

  async deleteNotification(userId, notificationId) {
    try {
      const userNotifications = this.notifications.get(userId) || [];
      const index = userNotifications.findIndex(n => n.id === notificationId);

      if (index === -1) {
        return {
          success: false,
          message: 'Notificación no encontrada'
        };
      }

      userNotifications.splice(index, 1);
      this.notifications.set(userId, userNotifications);

      return {
        success: true,
        message: 'Notificación eliminada'
      };
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      return {
        success: false,
        message: 'Error al eliminar notificación',
        error: error.message
      };
    }
  }

  async notifyEnrollmentSuccess(studentId, courseName) {
    const student = await Student.findByPk(studentId, {
      include: [{ model: User, as: 'user' }]
    });

    if (!student) return;

    return await this.createNotification(
      student.user_id,
      'success',
      'Matrícula Exitosa',
      `Te has matriculado exitosamente en ${courseName}`,
      { studentId, courseName }
    );
  }

  async notifyQueueActivated(studentId, batchNumber, position) {
    const student = await Student.findByPk(studentId, {
      include: [{ model: User, as: 'user' }]
    });

    if (!student) return;

    return await this.createNotification(
      student.user_id,
      'info',
      'Turno de Matrícula Activado',
      `Tu turno de matrícula ha sido activado. Lote ${batchNumber}, Posición ${position}`,
      { studentId, batchNumber, position }
    );
  }

  async notifyWarning(userId, title, message, metadata = {}) {
    return await this.createNotification(userId, 'warning', title, message, metadata);
  }

  async notifyError(userId, title, message, metadata = {}) {
    return await this.createNotification(userId, 'error', title, message, metadata);
  }

  generateId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async logNotification(notification) {
    try {
      await SystemLogs.create({
        action: 'notification_created',
        user_id: notification.userId,
        details: JSON.stringify({
          type: notification.type,
          title: notification.title,
          notificationId: notification.id
        }),
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error al registrar notificación en logs:', error);
    }
  }

  async getNotificationStats(userId) {
    try {
      const userNotifications = this.notifications.get(userId) || [];
      
      const stats = {
        total: userNotifications.length,
        unread: userNotifications.filter(n => !n.read).length,
        byType: {
          info: userNotifications.filter(n => n.type === 'info').length,
          warning: userNotifications.filter(n => n.type === 'warning').length,
          error: userNotifications.filter(n => n.type === 'error').length,
          success: userNotifications.filter(n => n.type === 'success').length
        }
      };

      return {
        success: true,
        stats
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return {
        success: false,
        message: 'Error al obtener estadísticas',
        error: error.message
      };
    }
  }

  async cleanOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      for (const [userId, notifications] of this.notifications.entries()) {
        const filtered = notifications.filter(n => new Date(n.createdAt) > thirtyDaysAgo);
        this.notifications.set(userId, filtered);
      }

      return {
        success: true,
        message: 'Notificaciones antiguas limpiadas'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al limpiar notificaciones',
        error: error.message
      };
    }
  }
}

// Instancia del servicio
const notificationService = new NotificationService();

// ==========================================
// PARTE 2: ROUTES (Endpoints REST)
// ==========================================

const router = express.Router();

// Middleware de autenticación simple
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token requerido'
    });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

// Obtener todas las notificaciones del usuario
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { unread } = req.query;
    const result = await notificationService.getNotifications(
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
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const result = await notificationService.getNotificationStats(req.user.userId);

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
router.put('/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const result = await notificationService.markAsRead(req.user.userId, notificationId);

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
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.userId);

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
router.delete('/:notificationId', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const result = await notificationService.deleteNotification(req.user.userId, notificationId);

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
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type, title, message, userId } = req.body;
    
    const result = await notificationService.createNotification(
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
router.post('/cleanup', authenticateToken, async (req, res) => {
  try {
    const result = await notificationService.cleanOldNotifications();

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

// ==========================================
// PARTE 3: SCRIPT INDEPENDIENTE
// ==========================================

class NotificationMicroservice {
  constructor() {
    this.service = notificationService;
    this.cleanupInterval = null;
  }

  /**
   * Iniciar el microservicio como script independiente
   */
  start() {
    console.log('🔔 Microservicio de Notificaciones iniciado');
    console.log('===========================================');
    console.log('Servicio de notificaciones internas activo');
    console.log('Limpieza automática cada 24 horas');
    console.log('===========================================');

    // Iniciar limpieza automática cada 24 horas
    this.cleanupInterval = setInterval(async () => {
      console.log('🧹 Ejecutando limpieza de notificaciones antiguas...');
      const result = await this.service.cleanOldNotifications();
      console.log(result.message);
    }, 24 * 60 * 60 * 1000); // 24 horas

    // Mantener el proceso activo
    this.keepAlive();
  }

  /**
   * Detener el microservicio
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    console.log('🔔 Microservicio de Notificaciones detenido');
  }

  /**
   * Mantener el proceso activo
   */
  keepAlive() {
    process.on('SIGTERM', () => {
      console.log('SIGTERM recibido');
      this.stop();
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log('SIGINT recibido');
      this.stop();
      process.exit(0);
    });
  }

  /**
   * Crear notificación de prueba
   */
  async createTestNotification(userId) {
    const result = await this.service.createNotification(
      userId,
      'info',
      'Notificación de Prueba',
      'Esta es una notificación de prueba del microservicio',
      { test: true }
    );
    console.log('Notificación de prueba creada:', result);
    return result;
  }

  /**
   * Obtener estadísticas
   */
  async getStats(userId) {
    const result = await this.service.getNotificationStats(userId);
    console.log('Estadísticas de notificaciones:', result);
    return result;
  }
}

// ==========================================
// EXPORTS
// ==========================================

// Exportar router para usar en Express
module.exports.router = router;

// Exportar servicio para usar en el código
module.exports.service = notificationService;

// Exportar clase del script independiente
module.exports.Microservice = NotificationMicroservice;

// Ejecutar como script independiente si se llama directamente
if (require.main === module) {
  const microservice = new NotificationMicroservice();
  microservice.start();

  // Si se proporcionan argumentos de línea de comandos
  const args = process.argv.slice(2);
  if (args.length > 0) {
    const command = args[0];
    
    if (command === 'test' && args[1]) {
      const userId = parseInt(args[1]);
      microservice.createTestNotification(userId);
    } else if (command === 'stats' && args[1]) {
      const userId = parseInt(args[1]);
      microservice.getStats(userId);
    } else {
      console.log('\nComandos disponibles:');
      console.log('  test <userId>      - Crear notificación de prueba');
      console.log('  stats <userId>     - Obtener estadísticas de notificaciones');
      console.log('\nEjemplo:');
      console.log('  node NotificationMicroservice.js test 1');
    }
  }
}
