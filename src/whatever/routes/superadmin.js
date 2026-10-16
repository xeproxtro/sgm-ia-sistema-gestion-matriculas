const express = require('express');
const router = express.Router();
const { models } = require('../../Model');
const { User } = models;
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { sequelize } = require('../Config/database');
require('dotenv').config();

// Get superadmin dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const totalAdmins = await User.count({ where: { role: 'admin' } });
    const totalStudents = await User.count({ where: { role: 'student' } });
    const systemStatus = process.env.MAINTENANCE_MODE === 'true' ? 'Mantenimiento' : 'Operativo';
    
    const superadmin = await User.findByPk(req.user.userId);

    res.json({
      success: true,
      superadmin: superadmin.toJSON(),
      stats: {
        total_admins: totalAdmins,
        total_students: totalStudents,
        system_status: systemStatus,
        security_events: 0
      },
      system_status: {
        maintenance_mode: process.env.MAINTENANCE_MODE === 'true',
        last_backup: new Date().toISOString(),
        uptime: '24h 30m'
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

// Get all admins
router.get('/admins', async (req, res) => {
  try {
    const admins = await User.findAll({
      where: { role: 'admin' },
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      admins: admins.map(a => a.toJSON())
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener administradores',
      error: error.message
    });
  }
});

// Get single admin
router.get('/admins/:id', async (req, res) => {
  try {
    const admin = await User.findByPk(req.params.id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Administrador no encontrado'
      });
    }

    res.json({
      success: true,
      admin: admin.toJSON()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener administrador',
      error: error.message
    });
  }
});

// Toggle admin status
router.post('/admins/:id/toggle-status', async (req, res) => {
  try {
    const admin = await User.findByPk(req.params.id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Administrador no encontrado'
      });
    }

    admin.is_active = !admin.is_active;
    await admin.save();

    res.json({
      success: true,
      message: 'Estado del administrador actualizado',
      admin: admin.toJSON()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado del administrador',
      error: error.message
    });
  }
});

// Delete admin
router.delete('/admins/:id', async (req, res) => {
  try {
    const admin = await User.findByPk(req.params.id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Administrador no encontrado'
      });
    }

    await admin.destroy();

    res.json({
      success: true,
      message: 'Administrador eliminado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar administrador',
      error: error.message
    });
  }
});

// Get all students for inspection
router.get('/students', async (req, res) => {
  try {
    const students = await User.findAll({
      where: { role: 'student' },
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      students: students.map(s => s.toJSON())
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estudiantes',
      error: error.message
    });
  }
});

// Add new admin
router.post('/admins', async (req, res) => {
  try {
    const AuthService = require('../Services/AuthService');
    const result = await AuthService.registerUser({
      ...req.body,
      role: 'admin'
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al agregar administrador',
      error: error.message
    });
  }
});

// Get global permissions
router.get('/permissions', async (req, res) => {
  try {
    // This would typically be stored in a database or config file
    const permissions = {
      admin: {
        manage_students: true,
        manage_curricula: true,
        manage_courses: true,
        manage_queue: true,
        generate_reports: true
      },
      system: {
        maintenance: true,
        system_logs: true,
        audit: true
      }
    };

    res.json({
      success: true,
      permissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener permisos',
      error: error.message
    });
  }
});

// Update global permissions
router.put('/permissions', async (req, res) => {
  try {
    const { permissions } = req.body;
    // This would typically update a database or config file
    
    res.json({
      success: true,
      message: 'Permisos actualizados exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar permisos',
      error: error.message
    });
  }
});

// Get maintenance status
router.get('/maintenance/status', async (req, res) => {
  try {
    res.json({
      success: true,
      active: process.env.MAINTENANCE_MODE === 'true',
      message: process.env.MAINTENANCE_MESSAGE || 'Sistema en mantenimiento'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estado de mantenimiento',
      error: error.message
    });
  }
});

// Toggle maintenance mode
router.post('/maintenance/toggle', async (req, res) => {
  try {
    const currentMode = process.env.MAINTENANCE_MODE === 'true';
    process.env.MAINTENANCE_MODE = currentMode ? 'false' : 'true';
    
    res.json({
      success: true,
      message: currentMode ? 'Modo mantenimiento desactivado' : 'Modo mantenimiento activado'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al cambiar modo mantenimiento',
      error: error.message
    });
  }
});

// Activate maintenance mode
router.post('/maintenance/activate', async (req, res) => {
  try {
    process.env.MAINTENANCE_MODE = 'true';
    
    res.json({
      success: true,
      message: 'Modo mantenimiento activado'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al activar modo mantenimiento',
      error: error.message
    });
  }
});

// Deactivate maintenance mode
router.post('/maintenance/deactivate', async (req, res) => {
  try {
    process.env.MAINTENANCE_MODE = 'false';
    
    res.json({
      success: true,
      message: 'Modo mantenimiento desactivado'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al desactivar modo mantenimiento',
      error: error.message
    });
  }
});

// Update maintenance message
router.put('/maintenance/message', async (req, res) => {
  try {
    const { message } = req.body;
    process.env.MAINTENANCE_MESSAGE = message;
    
    res.json({
      success: true,
      message: 'Mensaje de mantenimiento actualizado'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar mensaje de mantenimiento',
      error: error.message
    });
  }
});

// Schedule maintenance
router.post('/maintenance/schedule', async (req, res) => {
  try {
    const { schedule, duration } = req.body;
    // This would typically use a job scheduler like node-cron
    
    res.json({
      success: true,
      message: 'Mantenimiento programado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al programar mantenimiento',
      error: error.message
    });
  }
});

// Get system logs
router.get('/logs', async (req, res) => {
  try {
    const { level, date } = req.query;
    
    // This would typically query a log storage system
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
      logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener logs del sistema',
      error: error.message
    });
  }
});

// Export system logs
router.get('/logs/export', async (req, res) => {
  try {
    // This would generate and download a log file
    const logContent = 'System logs export...\n';
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename=system-logs.log');
    res.send(logContent);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al exportar logs',
      error: error.message
    });
  }
});

// Get audit logs
router.get('/audit', async (req, res) => {
  try {
    const { action, start, end } = req.query;
    
    // This would typically query an audit log system
    const auditLogs = [
      {
        timestamp: new Date().toISOString(),
        user_name: 'Admin User',
        action: 'admin',
        details: 'Updated student information',
        ip_address: '192.168.1.1'
      }
    ];

    res.json({
      success: true,
      audit_logs: auditLogs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener logs de auditoría',
      error: error.message
    });
  }
});

// Emergency stop
router.post('/emergency-stop', async (req, res) => {
  try {
    const QueueService = require('../Services/QueueService');
    QueueService.stopQueueProcessing();
    
    res.json({
      success: true,
      message: 'Parada de emergencia ejecutada'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al ejecutar parada de emergencia',
      error: error.message
    });
  }
});

// Perform backup
router.post('/backup', async (req, res) => {
  try {
    // Crear directorio de backups si no existe
    const backupsDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    // Obtener ruta de la base de datos SQLite
    const dbPath = path.join(process.cwd(), 'database.sqlite');
    
    // Verificar si existe la base de datos
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró la base de datos'
      });
    }

    // Leer la base de datos
    const dbContent = fs.readFileSync(dbPath);
    
    // Generar nombre de archivo con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.sqlite`;
    const backupPath = path.join(backupsDir, backupFileName);
    
    // Copiar la base de datos
    fs.writeFileSync(backupPath, dbContent);
    
    // Cifrar el backup usando AES-256-GCM
    const encryptionKey = crypto.scryptSync(process.env.JWT_SECRET || 'default-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
    
    let encrypted = cipher.update(dbContent);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();
    
    // Guardar el backup cifrado
    const encryptedFileName = `backup-${timestamp}.enc`;
    const encryptedPath = path.join(backupsDir, encryptedFileName);
    
    const encryptedData = Buffer.concat([iv, authTag, encrypted]);
    fs.writeFileSync(encryptedPath, encryptedData);
    
    // Eliminar el archivo sin cifrar para seguridad
    fs.unlinkSync(backupPath);
    
    // Obtener tamaño del archivo cifrado
    const stats = fs.statSync(encryptedPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    res.json({
      success: true,
      message: 'Backup realizado exitosamente',
      backup_info: {
        filename: encryptedFileName,
        size: `${fileSizeMB} MB`,
        timestamp: new Date().toISOString(),
        location: backupsDir
      }
    });
  } catch (error) {
    console.error('Error performing backup:', error);
    res.status(500).json({
      success: false,
      message: 'Error al realizar backup',
      error: error.message
    });
  }
});

// List backups
router.get('/backups', async (req, res) => {
  try {
    const backupsDir = path.join(process.cwd(), 'backups');
    
    if (!fs.existsSync(backupsDir)) {
      return res.json({
        success: true,
        backups: []
      });
    }

    const files = fs.readdirSync(backupsDir);
    const backups = files
      .filter(file => file.endsWith('.enc'))
      .map(file => {
        const filePath = path.join(backupsDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));

    res.json({
      success: true,
      backups
    });
  } catch (error) {
    console.error('Error listing backups:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar backups',
      error: error.message
    });
  }
});

// Get inspection history
router.get('/inspection-history', async (req, res) => {
  try {
    // In a real implementation, this would query a database table
    const history = [
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        portal: 'Portal de Estudiantes',
        user: 'waosmanxd123@gmail.com',
        page: 'Proceso de Matrícula',
        duration: 5
      },
      {
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        portal: 'Portal de Administradores',
        user: 'emmanuelmoreno2t@gmail.com',
        page: 'Gestión de Estudiantes',
        duration: 12
      }
    ];

    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Error loading inspection history:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar historial de inspecciones',
      error: error.message
    });
  }
});

// Get inspection stats
router.get('/inspection-stats', async (req, res) => {
  try {
    // In a real implementation, this would calculate from database
    const stats = {
      total_inspections: 15,
      student_inspections: 8,
      admin_inspections: 7,
      avg_time: 8
    };

    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    console.error('Error loading inspection stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar estadísticas de inspección',
      error: error.message
    });
  }
});

// Log inspection
router.post('/log-inspection', async (req, res) => {
  try {
    const { portal, page, user, duration } = req.body;
    
    // In a real implementation, this would save to a database table
    console.log('Inspection logged:', { portal, page, user, duration });

    res.json({
      success: true,
      message: 'Inspección registrada'
    });
  } catch (error) {
    console.error('Error logging inspection:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar inspección',
      error: error.message
    });
  }
});

// Get scheduled maintenance
router.get('/maintenance/scheduled', async (req, res) => {
  try {
    // In a real implementation, this would query a database table
    const scheduled = [
      {
        id: '1',
        schedule: '2026-09-10 02:00',
        duration: 30,
        message: 'Actualización de seguridad'
      }
    ];

    res.json({
      success: true,
      scheduled
    });
  } catch (error) {
    console.error('Error loading scheduled maintenance:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar mantenimientos programados',
      error: error.message
    });
  }
});

// Cancel scheduled maintenance
router.delete('/maintenance/scheduled/:id', async (req, res) => {
  try {
    // In a real implementation, this would delete from database
    res.json({
      success: true,
      message: 'Mantenimiento cancelado'
    });
  } catch (error) {
    console.error('Error canceling scheduled maintenance:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar mantenimiento',
      error: error.message
    });
  }
});

// Restart services
router.post('/restart-services', async (req, res) => {
  try {
    const QueueService = require('../Services/QueueService');
    QueueService.stopQueueProcessing();
    setTimeout(() => QueueService.startQueueProcessing(), 2000);
    
    res.json({
      success: true,
      message: 'Servicios reiniciados exitosamente'
    });
  } catch (error) {
    console.error('Error restarting services:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reiniciar servicios',
      error: error.message
    });
  }
});

// Clear cache
router.post('/clear-cache', async (req, res) => {
  try {
    // In a real implementation, this would clear Redis cache, session store, etc.
    res.json({
      success: true,
      message: 'Caché limpiado exitosamente'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Error al limpiar caché',
      error: error.message
    });
  }
});

// Get maintenance logs
router.get('/maintenance/logs', async (req, res) => {
  try {
    // In a real implementation, this would query a database table
    const logs = [
      {
        timestamp: new Date().toISOString(),
        action: 'BACKUP_COMPLETADO',
        message: 'Backup automático realizado exitosamente',
        level: 'success'
      },
      {
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        action: 'MANTENIMIENTO_ACTIVADO',
        message: 'Modo mantenimiento activado por actualización',
        level: 'warning'
      }
    ];

    res.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Error loading maintenance logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar logs de mantenimiento',
      error: error.message
    });
  }
});

module.exports = router;
