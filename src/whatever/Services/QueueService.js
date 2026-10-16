const { models } = require('../../Model');
const { Queue, Student } = models;
require('dotenv').config();

class QueueService {
  constructor() {
    this.batchSize = parseInt(process.env.BATCH_SIZE) || 200;
    this.checkInterval = parseInt(process.env.QUEUE_CHECK_INTERVAL) || 5000;
    this.currentBatch = 1;
    this.activeStudents = new Set();
    this.processingInterval = null;
  }

  async addToQueue(studentId) {
    try {
      const existingQueue = await Queue.findOne({
        where: { student_id: studentId }
      });

      if (existingQueue) {
        return {
          success: false,
          message: 'El estudiante ya está en la cola',
          queue: existingQueue
        };
      }

      const currentBatchCount = await Queue.count({
        where: { batch_number: this.currentBatch }
      });

      let batchNumber = this.currentBatch;
      let position = currentBatchCount + 1;

      if (currentBatchCount >= this.batchSize) {
        batchNumber = this.currentBatch + 1;
        position = 1;
      }

      const queueEntry = await Queue.create({
        student_id: studentId,
        batch_number: batchNumber,
        position_in_batch: position,
        status: 'waiting'
      });

      return {
        success: true,
        message: 'Estudiante añadido a la cola',
        queue: queueEntry
      };
    } catch (error) {
      console.error('Error al añadir a la cola:', error);
      return {
        success: false,
        message: 'Error al añadir a la cola',
        error: error.message
      };
    }
  }

  async getQueueStatus(studentId) {
    try {
      const queueEntry = await Queue.findOne({
        where: { student_id: studentId },
        include: [{ model: Student, as: 'student' }]
      });

      if (!queueEntry) {
        return {
          success: false,
          message: 'Estudiante no encontrado en la cola'
        };
      }

      const batchInfo = await this.getBatchInfo(queueEntry.batch_number);

      return {
        success: true,
        queue: queueEntry,
        batchInfo
      };
    } catch (error) {
      console.error('Error al obtener estado de cola:', error);
      return {
        success: false,
        message: 'Error al obtener estado de cola',
        error: error.message
      };
    }
  }

  async getBatchInfo(batchNumber) {
    try {
      const totalInBatch = await Queue.count({
        where: { batch_number }
      });

      const completedInBatch = await Queue.count({
        where: { batch_number, status: 'completed' }
      });

      const activeInBatch = await Queue.count({
        where: { batch_number, status: 'active' }
      });

      return {
        batchNumber,
        totalInBatch,
        completedInBatch,
        activeInBatch,
        waitingInBatch: totalInBatch - completedInBatch - activeInBatch
      };
    } catch (error) {
      console.error('Error al obtener información del lote:', error);
      return null;
    }
  }

  async activateNextStudent() {
    try {
      const nextStudent = await Queue.findOne({
        where: {
          batch_number: this.currentBatch,
          status: 'waiting'
        },
        order: [['position_in_batch', 'ASC']]
      });

      if (!nextStudent) {
        await this.moveToNextBatch();
        return null;
      }

      if (this.activeStudents.size >= this.batchSize) {
        return null;
      }

      nextStudent.status = 'active';
      nextStudent.activated_at = new Date();
      await nextStudent.save();

      this.activeStudents.add(nextStudent.student_id);

      return nextStudent;
    } catch (error) {
      console.error('Error al activar siguiente estudiante:', error);
      return null;
    }
  }

  async moveToNextBatch() {
    try {
      const remainingInBatch = await Queue.count({
        where: {
          batch_number: this.currentBatch,
          status: ['waiting', 'active']
        }
      });

      if (remainingInBatch === 0) {
        this.currentBatch++;
        console.log(`Moviendo al lote ${this.currentBatch}`);
      }
    } catch (error) {
      console.error('Error al mover al siguiente lote:', error);
    }
  }

  async completeQueueEntry(studentId) {
    try {
      const queueEntry = await Queue.findOne({
        where: { student_id: studentId }
      });

      if (!queueEntry) {
        return {
          success: false,
          message: 'Entrada de cola no encontrada'
        };
      }

      queueEntry.status = 'completed';
      queueEntry.completed_at = new Date();
      await queueEntry.save();

      this.activeStudents.delete(studentId);

      return {
        success: true,
        message: 'Entrada de cola completada',
        queue: queueEntry
      };
    } catch (error) {
      console.error('Error al completar entrada de cola:', error);
      return {
        success: false,
        message: 'Error al completar entrada de cola',
        error: error.message
      };
    }
  }

  async skipQueueEntry(studentId) {
    try {
      const queueEntry = await Queue.findOne({
        where: { student_id: studentId }
      });

      if (!queueEntry) {
        return {
          success: false,
          message: 'Entrada de cola no encontrada'
        };
      }

      queueEntry.status = 'skipped';
      await queueEntry.save();

      this.activeStudents.delete(studentId);

      return {
        success: true,
        message: 'Entrada de cola saltada',
        queue: queueEntry
      };
    } catch (error) {
      console.error('Error al saltar entrada de cola:', error);
      return {
        success: false,
        message: 'Error al saltar entrada de cola',
        error: error.message
      };
    }
  }

  startQueueProcessing() {
    if (this.processingInterval) {
      console.log('El procesamiento de cola ya está activo');
      return;
    }

    console.log('Iniciando procesamiento de cola...');
    this.processingInterval = setInterval(async () => {
      await this.processQueue();
    }, this.checkInterval);
  }

  stopQueueProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('Procesamiento de cola detenido');
    }
  }

  async processQueue() {
    try {
      if (this.activeStudents.size < this.batchSize) {
        await this.activateNextStudent();
      }
    } catch (error) {
      console.error('Error en el procesamiento de cola:', error);
    }
  }

  async getQueueStatistics() {
    try {
      const totalWaiting = await Queue.count({ where: { status: 'waiting' } });
      const totalActive = await Queue.count({ where: { status: 'active' } });
      const totalCompleted = await Queue.count({ where: { status: 'completed' } });
      const totalSkipped = await Queue.count({ where: { status: 'skipped' } });

      return {
        totalWaiting,
        totalActive,
        totalCompleted,
        totalSkipped,
        currentBatch: this.currentBatch,
        activeStudents: this.activeStudents.size
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de cola:', error);
      return null;
    }
  }

  async resetQueue() {
    try {
      await Queue.destroy({ where: {} });
      this.currentBatch = 1;
      this.activeStudents.clear();
      
      return {
        success: true,
        message: 'Cola reiniciada exitosamente'
      };
    } catch (error) {
      console.error('Error al reiniciar cola:', error);
      return {
        success: false,
        message: 'Error al reiniciar cola',
        error: error.message
      };
    }
  }
}

module.exports = new QueueService();
