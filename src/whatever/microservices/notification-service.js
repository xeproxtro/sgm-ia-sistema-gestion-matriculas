/**
 * Microservicio de Notificaciones
 * Script independiente para ejecutar el servicio de notificaciones
 * 
 * Uso:
 * node src/whatever/microservices/notification-service.js
 * o
 * npm run microservice:notifications
 */

const NotificationService = require('../Services/NotificationService');
require('dotenv').config();

class NotificationMicroservice {
  constructor() {
    this.service = NotificationService;
    this.cleanupInterval = null;
  }

  /**
   * Iniciar el microservicio
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

// Ejecutar si se llama directamente
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
      console.log('  node notification-service.js test 1');
    }
  }
}

module.exports = NotificationMicroservice;
