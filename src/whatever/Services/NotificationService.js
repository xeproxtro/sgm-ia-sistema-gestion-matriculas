const { models } = require('../../Model');
const { Student, User, SystemLogs } = models;

class NotificationService {
  constructor() {
    this.notifications = new Map(); // Almacenamiento en memoria para notificaciones activas
    this.maxNotifications = 100; // Máximo de notificaciones por usuario
  }

  /**
   * Crear una notificación interna
   * @param {number} userId - ID del usuario
   * @param {string} type - Tipo de notificación (info, warning, error, success)
   * @param {string} title - Título de la notificación
   * @param {string} message - Mensaje de la notificación
   * @param {object} metadata - Datos adicionales opcionales
   */
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

      // Obtener notificaciones existentes del usuario
      const userNotifications = this.notifications.get(userId) || [];
      
      // Agregar nueva notificación
      userNotifications.unshift(notification);
      
      // Limitar número de notificaciones
      if (userNotifications.length > this.maxNotifications) {
        userNotifications.pop();
      }
      
      this.notifications.set(userId, userNotifications);

      // Registrar en logs del sistema
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

  /**
   * Obtener notificaciones de un usuario
   * @param {number} userId - ID del usuario
   * @param {boolean} unreadOnly - Solo no leídas
   */
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

  /**
   * Marcar notificación como leída
   * @param {number} userId - ID del usuario
   * @param {string} notificationId - ID de la notificación
   */
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

  /**
   * Marcar todas las notificaciones de un usuario como leídas
   * @param {number} userId - ID del usuario
   */
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

  /**
   * Eliminar una notificación
   * @param {number} userId - ID del usuario
   * @param {string} notificationId - ID de la notificación
   */
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

  /**
   * Enviar notificación de matrícula exitosa
   */
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

  /**
   * Enviar notificación de cola activada
   */
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

  /**
   * Enviar notificación de advertencia
   */
  async notifyWarning(userId, title, message, metadata = {}) {
    return await this.createNotification(userId, 'warning', title, message, metadata);
  }

  /**
   * Enviar notificación de error
   */
  async notifyError(userId, title, message, metadata = {}) {
    return await this.createNotification(userId, 'error', title, message, metadata);
  }

  /**
   * Generar ID único para notificación
   */
  generateId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Registrar notificación en logs del sistema
   */
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

  /**
   * Obtener estadísticas de notificaciones
   */
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

  /**
   * Limpiar notificaciones antiguas (más de 30 días)
   */
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
      console.error('Error al limpiar notificaciones:', error);
      return {
        success: false,
        message: 'Error al limpiar notificaciones',
        error: error.message
      };
    }
  }
}

module.exports = new NotificationService();
