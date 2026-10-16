/**
 * Microservicio de Generación de Archivos
 * Script independiente para ejecutar el servicio de generación de archivos Excel/CSV
 * 
 * Uso:
 * node src/whatever/microservices/file-generation-service.js
 * o
 * npm run microservice:file-generation
 */

const FileGenerationService = require('../Services/FileGenerationService');
const { sequelize } = require('../Config/database');
require('dotenv').config();

class FileGenerationMicroservice {
  constructor() {
    this.service = FileGenerationService;
    this.cleanupInterval = null;
  }

  /**
   * Iniciar el microservicio
   */
  async start() {
    try {
      // Conectar a la base de datos
      await sequelize.authenticate();
      console.log('✅ Conexión a base de datos establecida');

      console.log('📊 Microservicio de Generación de Archivos iniciado');
      console.log('===========================================');
      console.log('Directorio de salida:', this.service.outputDir);
      console.log('Formatos soportados: Excel (.xlsx), CSV (.csv)');
      console.log('Limpieza automática cada 7 días');
      console.log('===========================================');

      // Iniciar limpieza automática cada 7 días
      this.cleanupInterval = setInterval(async () => {
        console.log('🧹 Ejecutando limpieza de archivos antiguos...');
        const result = await this.service.cleanOldExports();
        console.log(result.message);
      }, 7 * 24 * 60 * 60 * 1000); // 7 días

      // Mantener el proceso activo
      this.keepAlive();
    } catch (error) {
      console.error('❌ Error al iniciar microservicio:', error);
      process.exit(1);
    }
  }

  /**
   * Detener el microservicio
   */
  async stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    await sequelize.close();
    console.log('📊 Microservicio de Generación de Archivos detenido');
  }

  /**
   * Mantener el proceso activo
   */
  keepAlive() {
    process.on('SIGTERM', async () => {
      console.log('SIGTERM recibido');
      await this.stop();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT recibido');
      await this.stop();
      process.exit(0);
    });
  }

  /**
   * Generar Excel de lista de estudiantes
   */
  async generateStudentListExcel(filters = {}) {
    console.log('📊 Generando Excel de lista de estudiantes...');
    const result = await this.service.generateStudentListExcel(filters);
    console.log(result.success ? `✅ Excel generado (${result.count} registros)` : '❌ Error:', result.message);
    return result;
  }

  /**
   * Generar CSV de lista de estudiantes
   */
  async generateStudentListCSV(filters = {}) {
    console.log('📊 Generando CSV de lista de estudiantes...');
    const result = await this.service.generateStudentListCSV(filters);
    console.log(result.success ? `✅ CSV generado (${result.count} registros)` : '❌ Error:', result.message);
    return result;
  }

  /**
   * Generar Excel de historial académico
   */
  async generateAcademicHistoryExcel(studentId) {
    console.log(`📊 Generando Excel de historial académico para estudiante ${studentId}...`);
    const result = await this.service.generateAcademicHistoryExcel(studentId);
    console.log(result.success ? `✅ Excel generado (${result.count} registros)` : '❌ Error:', result.message);
    return result;
  }

  /**
   * Generar Excel de malla curricular
   */
  async generateCurriculumExcel(curriculumId) {
    console.log(`📊 Generando Excel de malla curricular ${curriculumId}...`);
    const result = await this.service.generateCurriculumExcel(curriculumId);
    console.log(result.success ? `✅ Excel generado (${result.count} registros)` : '❌ Error:', result.message);
    return result;
  }

  /**
   * Generar Excel de reporte de matrículas
   */
  async generateEnrollmentReportExcel(filters = {}) {
    console.log('📊 Generando Excel de reporte de matrículas...');
    const result = await this.service.generateEnrollmentReportExcel(filters);
    console.log(result.success ? `✅ Excel generado (${result.count} registros)` : '❌ Error:', result.message);
    return result;
  }

  /**
   * Obtener lista de archivos exportados
   */
  async getExportedList() {
    console.log('📋 Obteniendo lista de archivos exportados...');
    const result = await this.service.getExportedList();
    console.log(result.success ? `✅ ${result.files.length} archivos encontrados` : '❌ Error:', result.message);
    return result;
  }

  /**
   * Limpiar archivos antiguos manualmente
   */
  async cleanup() {
    console.log('🧹 Limpiando archivos antiguos...');
    const result = await this.service.cleanOldExports();
    console.log(result.message);
    return result;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const microservice = new FileGenerationMicroservice();
  microservice.start();

  // Si se proporcionan argumentos de línea de comandos
  const args = process.argv.slice(2);
  if (args.length > 0) {
    const command = args[0];
    
    if (command === 'students-excel') {
      const filters = {};
      if (args[1]) filters.program = args[1];
      if (args[2]) filters.semester = parseInt(args[2]);
      microservice.generateStudentListExcel(filters);
    } else if (command === 'students-csv') {
      const filters = {};
      if (args[1]) filters.program = args[1];
      if (args[2]) filters.semester = parseInt(args[2]);
      microservice.generateStudentListCSV(filters);
    } else if (command === 'history' && args[1]) {
      const studentId = parseInt(args[1]);
      microservice.generateAcademicHistoryExcel(studentId);
    } else if (command === 'curriculum' && args[1]) {
      const curriculumId = parseInt(args[1]);
      microservice.generateCurriculumExcel(curriculumId);
    } else if (command === 'enrollment-report') {
      const filters = {};
      if (args[1]) filters.program = args[1];
      if (args[2]) filters.semester = parseInt(args[2]);
      microservice.generateEnrollmentReportExcel(filters);
    } else if (command === 'list') {
      microservice.getExportedList();
    } else if (command === 'cleanup') {
      microservice.cleanup();
    } else {
      console.log('\nComandos disponibles:');
      console.log('  students-excel [program] [semester] - Generar Excel de estudiantes');
      console.log('  students-csv [program] [semester]  - Generar CSV de estudiantes');
      console.log('  history <studentId>                - Generar Excel de historial académico');
      console.log('  curriculum <curriculumId>          - Generar Excel de malla curricular');
      console.log('  enrollment-report [program] [sem]  - Generar Excel de reporte de matrículas');
      console.log('  list                               - Listar archivos exportados');
      console.log('  cleanup                            - Limpiar archivos antiguos');
      console.log('\nEjemplos:');
      console.log('  node file-generation-service.js students-excel "Ingeniería de Sistemas" 5');
      console.log('  node file-generation-service.js history 1');
    }
  }
}

module.exports = FileGenerationMicroservice;
