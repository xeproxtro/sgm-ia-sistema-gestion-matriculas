/**
 * Microservicio de Generación de Reportes PDF (Compacto)
 * Contiene: Service, Routes y Script en un solo archivo
 * 
 * Uso como módulo en Express:
 * const PDFReportMicroservice = require('./microservices/PDFReportMicroservice');
 * app.use('/api/reports/pdf', PDFReportMicroservice.router);
 * 
 * Uso como script independiente:
 * node src/whatever/microservices/PDFReportMicroservice.js
 */

const express = require('express');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { models } = require('../../Model');
const { Student, AcademicRecord, Subject, Curriculum, User } = models;
const { sequelize } = require('../Config/database');
require('dotenv').config();

// ==========================================
// PARTE 1: SERVICE (Lógica de Negocio)
// ==========================================

class PDFReportService {
  constructor() {
    this.outputDir = path.join(__dirname, '../../uploads/reports');
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generar reporte de historial académico en PDF
   */
  async generateAcademicHistoryReport(studentId) {
    return new Promise(async (resolve, reject) => {
      try {
        const student = await Student.findByPk(studentId, {
          include: [
            { model: User, as: 'user' },
            { model: AcademicRecord, as: 'academicRecords', include: [{ model: Subject, as: 'subject' }] }
          ]
        });

        if (!student) {
          return reject(new Error('Estudiante no encontrado'));
        }

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const filename = path.join(this.outputDir, `historial_${student.document_number}_${Date.now()}.pdf`);
        const stream = fs.createWriteStream(filename);

        doc.pipe(stream);

        // Encabezado
        this.addHeader(doc, 'Historial Académico');

        // Información del estudiante
        doc.fontSize(12).font('Helvetica-Bold').text('Información del Estudiante:');
        doc.fontSize(10).font('Helvetica');
        doc.text(`Nombre: ${student.name}`);
        doc.text(`Documento: ${student.document_number}`);
        doc.text(`Programa: ${student.program}`);
        doc.text(`Semestre Actual: ${student.semester}`);
        doc.moveDown();

        // Línea separadora
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Tabla de materias
        doc.fontSize(12).font('Helvetica-Bold').text('Registro Académico:');
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const itemHeight = 25;

        // Encabezados de tabla
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Código', 50, tableTop);
        doc.text('Materia', 100, tableTop);
        doc.text('Créditos', 300, tableTop);
        doc.text('Año', 380, tableTop);
        doc.text('Semestre', 430, tableTop);
        doc.text('Nota', 480, tableTop);
        doc.text('Estado', 510, tableTop);

        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        let currentY = tableTop + 20;
        let totalCredits = 0;
        let approvedCount = 0;

        student.academicRecords.forEach(record => {
          doc.fontSize(8).font('Helvetica');
          doc.text(record.subject?.code || 'N/A', 50, currentY);
          doc.text(record.subject?.name || 'N/A', 100, currentY);
          doc.text((record.subject?.credits || 0).toString(), 300, currentY);
          doc.text(record.year?.toString() || 'N/A', 380, currentY);
          doc.text(record.semester_taken?.toString() || 'N/A', 430, currentY);
          doc.text(record.grade?.toString() || 'N/A', 480, currentY);
          doc.text(this.translateStatus(record.status), 510, currentY);
          currentY += itemHeight;

          if (record.status === 'approved') {
            totalCredits += record.subject?.credits || 0;
            approvedCount++;
          }
        });

        doc.y = currentY + 10;
        doc.moveDown();

        // Resumen
        doc.fontSize(10).font('Helvetica-Bold').text('Resumen:');
        doc.fontSize(9).font('Helvetica');
        doc.text(`Total de Créditos Aprobados: ${totalCredits}`);
        doc.text(`Materias Aprobadas: ${approvedCount}`);
        doc.text(`Promedio General: ${this.calculateGPA(student.academicRecords)}`);

        // Pie de página
        this.addFooter(doc);

        doc.end();

        stream.on('finish', () => resolve({ success: true, filename, path: filename }));
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generar reporte de malla curricular en PDF
   */
  async generateCurriculumReport(curriculumId) {
    return new Promise(async (resolve, reject) => {
      try {
        const curriculum = await Curriculum.findByPk(curriculumId, {
          include: [{ model: Subject, as: 'subjects' }]
        });

        if (!curriculum) {
          return reject(new Error('Malla curricular no encontrada'));
        }

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const filename = path.join(this.outputDir, `malla_${curriculum.program}_${Date.now()}.pdf`);
        const stream = fs.createWriteStream(filename);

        doc.pipe(stream);

        // Encabezado
        this.addHeader(doc, 'Malla Curricular');

        // Información de la malla
        doc.fontSize(12).font('Helvetica-Bold').text('Información del Programa:');
        doc.fontSize(10).font('Helvetica');
        doc.text(`Programa: ${curriculum.program}`);
        doc.text(`Versión: ${curriculum.version}`);
        doc.text(`Total de Créditos: ${curriculum.total_credits}`);
        doc.text(`Duración: ${curriculum.duration_semesters} Semestres`);
        doc.moveDown();

        // Línea separadora
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Agrupar por semestre
        const bySemester = {};
        curriculum.subjects.forEach(subject => {
          if (!bySemester[subject.semester]) {
            bySemester[subject.semester] = [];
          }
          bySemester[subject.semester].push(subject);
        });

        // Generar tabla por semestre
        Object.keys(bySemester).sort((a, b) => a - b).forEach(semester => {
          doc.fontSize(11).font('Helvetica-Bold').text(`Semestre ${semester}:`);
          doc.moveDown(0.5);

          const tableTop = doc.y;
          const itemHeight = 25;

          // Encabezados
          doc.fontSize(9).font('Helvetica-Bold');
          doc.text('Código', 50, tableTop);
          doc.text('Materia', 100, tableTop);
          doc.text('Créditos', 300, tableTop);
          doc.text('Tipo', 380, tableTop);

          doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

          let currentY = tableTop + 20;
          bySemester[semester].forEach(subject => {
            doc.fontSize(8).font('Helvetica');
            doc.text(subject.code, 50, currentY);
            doc.text(subject.name, 100, currentY);
            doc.text(subject.credits.toString(), 300, currentY);
            doc.text(this.translateType(subject.type), 380, currentY);
            currentY += itemHeight;
          });

          doc.y = currentY + 10;
          doc.moveDown();
        });

        // Pie de página
        this.addFooter(doc);

        doc.end();

        stream.on('finish', () => resolve({ success: true, filename, path: filename }));
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generar reporte de certificado de matrícula
   */
  async generateEnrollmentCertificate(studentId) {
    return new Promise(async (resolve, reject) => {
      try {
        const student = await Student.findByPk(studentId, {
          include: [{ model: User, as: 'user' }]
        });

        if (!student) {
          return reject(new Error('Estudiante no encontrado'));
        }

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const filename = path.join(this.outputDir, `certificado_${student.document_number}_${Date.now()}.pdf`);
        const stream = fs.createWriteStream(filename);

        doc.pipe(stream);

        // Encabezado
        this.addHeader(doc, 'Certificado de Matrícula');

        // Contenido del certificado
        doc.fontSize(12).font('Helvetica');
        doc.moveDown(2);
        doc.text('La Universidad certifica que:', { align: 'center' });
        doc.moveDown();

        doc.fontSize(14).font('Helvetica-Bold').text(student.name, { align: 'center' });
        doc.moveDown();

        doc.fontSize(12).font('Helvetica');
        doc.text(`Identificado con documento No. ${student.document_number}`, { align: 'center' });
        doc.text(`Se encuentra matriculado en el programa de ${student.program}`, { align: 'center' });
        doc.text(`Semestre actual: ${student.semester}`, { align: 'center' });
        doc.moveDown(2);

        doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' });
        doc.moveDown(3);

        doc.text('_________________________', { align: 'center' });
        doc.text('Firma Autorizada', { align: 'center' });

        // Pie de página
        this.addFooter(doc);

        doc.end();

        stream.on('finish', () => resolve({ success: true, filename, path: filename }));
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generar reporte de lista de estudiantes en PDF
   */
  async generateStudentListReport(filters = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        const where = {};
        if (filters.program) where.program = filters.program;
        if (filters.semester) where.semester = filters.semester;

        const students = await Student.findAll({
          where,
          include: [{ model: User, as: 'user' }],
          order: [['name', 'ASC']]
        });

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const filename = path.join(this.outputDir, `lista_estudiantes_${Date.now()}.pdf`);
        const stream = fs.createWriteStream(filename);

        doc.pipe(stream);

        // Encabezado
        this.addHeader(doc, 'Lista de Estudiantes');

        // Filtros aplicados
        if (Object.keys(filters).length > 0) {
          doc.fontSize(10).font('Helvetica-Bold').text('Filtros Aplicados:');
          doc.fontSize(9).font('Helvetica');
          if (filters.program) doc.text(`Programa: ${filters.program}`);
          if (filters.semester) doc.text(`Semestre: ${filters.semester}`);
          doc.moveDown();
        }

        // Tabla de estudiantes
        doc.fontSize(10).font('Helvetica-Bold').text(`Total de Estudiantes: ${students.length}`);
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const itemHeight = 25;

        // Encabezados
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Documento', 50, tableTop);
        doc.text('Nombre', 120, tableTop);
        doc.text('Programa', 350, tableTop);
        doc.text('Semestre', 480, tableTop);

        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        let currentY = tableTop + 20;
        students.forEach(student => {
          doc.fontSize(8).font('Helvetica');
          doc.text(student.document_number, 50, currentY);
          doc.text(student.name, 120, currentY);
          doc.text(student.program, 350, currentY);
          doc.text(student.semester.toString(), 480, currentY);
          currentY += itemHeight;

          // Nueva página si es necesario
          if (currentY > 750) {
            doc.addPage();
            currentY = 50;
          }
        });

        // Pie de página
        this.addFooter(doc);

        doc.end();

        stream.on('finish', () => resolve({ success: true, filename, path: filename }));
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Agregar encabezado estándar
   */
  addHeader(doc, title) {
    doc.fontSize(18).font('Helvetica-Bold').text(title, { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Unidades Tecnológicas de Santander - UTS', { align: 'center' });
    doc.fontSize(9).text('Sistema de Gestión de Matrículas', { align: 'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();
  }

  /**
   * Agregar pie de página estándar
   */
  addFooter(doc) {
    doc.fontSize(8).text('Documento generado automáticamente por el Sistema de Gestión de Matrículas', { align: 'center' });
    doc.text(`Fecha: ${new Date().toLocaleString('es-ES')}`, { align: 'center' });
  }

  /**
   * Traducir estado
   */
  translateStatus(status) {
    const translations = {
      'approved': 'Aprobado',
      'failed': 'Reprobado',
      'cancelled': 'Cancelado',
      'in_progress': 'En curso',
      'pending': 'Pendiente'
    };
    return translations[status] || status;
  }

  /**
   * Traducir tipo de materia
   */
  translateType(type) {
    const translations = {
      'mandatory': 'Obligatoria',
      'elective': 'Electiva',
      'optional': 'Optativa'
    };
    return translations[type] || type;
  }

  /**
   * Calcular promedio
   */
  calculateGPA(records) {
    const graded = records.filter(r => r.grade !== null && r.grade !== undefined);
    if (graded.length === 0) return '0.00';
    const sum = graded.reduce((acc, r) => acc + r.grade, 0);
    return (sum / graded.length).toFixed(2);
  }

  /**
   * Eliminar reporte antiguo
   */
  async deleteReport(filename) {
    try {
      const filepath = path.join(this.outputDir, filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return { success: true, message: 'Reporte eliminado' };
      }
      return { success: false, message: 'Reporte no encontrado' };
    } catch (error) {
      return { success: false, message: 'Error al eliminar reporte', error: error.message };
    }
  }

  /**
   * Limpiar reportes antiguos (más de 7 días)
   */
  async cleanOldReports() {
    try {
      const files = fs.readdirSync(this.outputDir);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      let deletedCount = 0;
      files.forEach(file => {
        const filepath = path.join(this.outputDir, file);
        const stats = fs.statSync(filepath);
        if (stats.mtime < sevenDaysAgo) {
          fs.unlinkSync(filepath);
          deletedCount++;
        }
      });

      return {
        success: true,
        message: `${deletedCount} reportes antiguos eliminados`
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al limpiar reportes',
        error: error.message
      };
    }
  }
}

// Instancia del servicio
const pdfReportService = new PDFReportService();

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

// Generar reporte de historial académico
router.post('/academic-history/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await pdfReportService.generateAcademicHistoryReport(parseInt(studentId));

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      message: 'Reporte generado exitosamente',
      filename: result.filename,
      url: `/uploads/reports/${path.basename(result.filename)}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte',
      error: error.message
    });
  }
});

// Generar reporte de malla curricular
router.post('/curriculum/:curriculumId', authenticateToken, async (req, res) => {
  try {
    const { curriculumId } = req.params;
    const result = await pdfReportService.generateCurriculumReport(parseInt(curriculumId));

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      message: 'Reporte generado exitosamente',
      filename: result.filename,
      url: `/uploads/reports/${path.basename(result.filename)}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte',
      error: error.message
    });
  }
});

// Generar certificado de matrícula
router.post('/enrollment-certificate/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await pdfReportService.generateEnrollmentCertificate(parseInt(studentId));

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      message: 'Certificado generado exitosamente',
      filename: result.filename,
      url: `/uploads/reports/${path.basename(result.filename)}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al generar certificado',
      error: error.message
    });
  }
});

// Generar reporte de lista de estudiantes
router.post('/student-list', authenticateToken, async (req, res) => {
  try {
    const filters = req.body;
    const result = await pdfReportService.generateStudentListReport(filters);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      message: 'Reporte generado exitosamente',
      filename: result.filename,
      url: `/uploads/reports/${path.basename(result.filename)}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte',
      error: error.message
    });
  }
});

// Eliminar reporte
router.delete('/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;
    const result = await pdfReportService.deleteReport(filename);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar reporte',
      error: error.message
    });
  }
});

// Limpiar reportes antiguos (solo superadmin)
router.post('/cleanup', authenticateToken, async (req, res) => {
  try {
    const result = await pdfReportService.cleanOldReports();

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al limpiar reportes',
      error: error.message
    });
  }
});

// ==========================================
// PARTE 3: SCRIPT INDEPENDIENTE
// ==========================================

class PDFReportMicroservice {
  constructor() {
    this.service = pdfReportService;
    this.cleanupInterval = null;
  }

  /**
   * Iniciar el microservicio como script independiente
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

// ==========================================
// EXPORTS
// ==========================================

// Exportar router para usar en Express
module.exports.router = router;

// Exportar servicio para usar en el código
module.exports.service = pdfReportService;

// Exportar clase del script independiente
module.exports.Microservice = PDFReportMicroservice;

// Ejecutar como script independiente si se llama directamente
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
      console.log('  node PDFReportMicroservice.js history 1');
      console.log('  node PDFReportMicroservice.js students "Ingeniería de Sistemas" 5');
    }
  }
}
