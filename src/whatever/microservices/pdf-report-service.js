/**
 * Microservicio de Generación de Reportes PDF
 * Script independiente para ejecutar el servicio de generación de PDFs
 * 
 * Uso:
 * node src/whatever/microservices/pdf-report-service.js
 * o
 * npm run microservice:pdf-reports
 */

const PDFReportService = require('../Services/PDFReportService');
const { sequelize } = require('../Config/database');
require('dotenv').config();

class PDFReportMicroservice {
  constructor() {
    this.service = PDFReportService;
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

      console.log('📄 Microservicio de Reportes PDF iniciado');
      console.log('===========================================');
      console.log('Directorio de salida:', this.service.outputDir);
      console.log('Limpieza automática cada 7 días');
      console.log('===========================================');

      // Iniciar limpieza automática cada 7 días
      this.cleanupInterval = setInterval(async () => {
        console.log('🧹 Ejecutando limpieza de reportes antiguos...');
        const result = await this.service.cleanOldReports();
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
    console.log('📄 Microservicio de Reportes PDF detenido');
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
   * Generar reporte de historial académico
   */
  async generateAcademicHistory(studentId) {
    console.log(`📄 Generando historial académico para estudiante ${studentId}...`);
    const result = await this.service.generateAcademicHistoryReport(studentId);
    console.log(result.success ? '✅ Reporte generado' : '❌ Error:', result.message);
    return result;
  }

  /**
   * Generar reporte de malla curricular
   */
  async generateCurriculum(curriculumId) {
    console.log(`📄 Generando malla curricular ${curriculumId}...`);
    const result = await this.service.generateCurriculumReport(curriculumId);
    console.log(result.success ? '✅ Reporte generado' : '❌ Error:', result.message);
    return result;
  }

  /**
   * Generar certificado de matrícula
   */
  async generateEnrollmentCertificate(studentId) {
    console.log(`📄 Generando certificado de matrícula para estudiante ${studentId}...`);
    const result = await this.service.generateEnrollmentCertificate(studentId);
    console.log(result.success ? '✅ Certificado generado' : '❌ Error:', result.message);
    return result;
  }

  /**
   * Generar lista de estudiantes
   */
  async generateStudentList(filters = {}) {
    console.log('📄 Generando lista de estudiantes...');
    const result = await this.service.generateStudentListReport(filters);
    console.log(result.success ? '✅ Reporte generado' : '❌ Error:', result.message);
    return result;
  }

  /**
   * Limpiar reportes antiguos manualmente
   */
  async cleanup() {
    console.log('🧹 Limpiando reportes antiguos...');
    const result = await this.service.cleanOldReports();
    console.log(result.message);
    return result;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const microservice = new PDFReportMicroservice();
  microservice.start();

  // Si se proporcionan argumentos de línea de comandos
  const args = process.argv.slice(2);
  if (args.length > 0) {
    const command = args[0];
    
    if (command === 'history' && args[1]) {
      const studentId = parseInt(args[1]);
      microservice.generateAcademicHistory(studentId);
    } else if (command === 'curriculum' && args[1]) {
      const curriculumId = parseInt(args[1]);
      microservice.generateCurriculum(curriculumId);
    } else if (command === 'certificate' && args[1]) {
      const studentId = parseInt(args[1]);
      microservice.generateEnrollmentCertificate(studentId);
    } else if (command === 'students') {
      const filters = {};
      if (args[1]) filters.program = args[1];
      if (args[2]) filters.semester = parseInt(args[2]);
      microservice.generateStudentList(filters);
    } else if (command === 'cleanup') {
      microservice.cleanup();
    } else {
      console.log('\nComandos disponibles:');
      console.log('  history <studentId>          - Generar historial académico');
      console.log('  curriculum <curriculumId>    - Generar malla curricular');
      console.log('  certificate <studentId>      - Generar certificado de matrícula');
      console.log('  students [program] [semester] - Generar lista de estudiantes');
      console.log('  cleanup                     - Limpiar reportes antiguos');
      console.log('\nEjemplos:');
      console.log('  node pdf-report-service.js history 1');
      console.log('  node pdf-report-service.js students "Ingeniería de Sistemas" 5');
    }
  }
}

module.exports = PDFReportMicroservice;
