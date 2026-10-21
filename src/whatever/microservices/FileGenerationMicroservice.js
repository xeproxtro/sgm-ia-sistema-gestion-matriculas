/**
 * Microservicio de Generación de Archivos (Compacto)
 * Contiene: Service, Routes y Script en un solo archivo
 * 
 * Uso como módulo en Express:
 * const FileGenerationMicroservice = require('./microservices/FileGenerationMicroservice');
 * app.use('/api/reports/files', FileGenerationMicroservice.router);
 * 
 * Uso como script independiente:
 * node src/whatever/microservices/FileGenerationMicroservice.js
 */

const express = require('express');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { models } = require('../../Model');
const { Student, AcademicRecord, Subject, Curriculum, User } = models;
const { sequelize } = require('../Config/database');
require('dotenv').config();

// ==========================================
// PARTE 1: SERVICE (Lógica de Negocio)
// ==========================================

class FileGenerationService {
  constructor() {
    this.outputDir = path.join(__dirname, '../../uploads/exports');
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generar Excel de lista de estudiantes
   */
  async generateStudentListExcel(filters = {}) {
    try {
      const where = {};
      if (filters.program) where.program = filters.program;
      if (filters.semester) where.semester = filters.semester;

      const students = await Student.findAll({
        where,
        include: [{ model: User, as: 'user' }],
        order: [['name', 'ASC']]
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Estudiantes');

      // Encabezados
      worksheet.columns = [
        { header: 'Documento', key: 'document', width: 15 },
        { header: 'Nombre', key: 'name', width: 30 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Teléfono', key: 'phone', width: 15 },
        { header: 'Programa', key: 'program', width: 25 },
        { header: 'Semestre', key: 'semester', width: 10 }
      ];

      // Datos
      students.forEach(student => {
        worksheet.addRow({
          document: student.document_number,
          name: student.name,
          email: student.user?.email || 'N/A',
          phone: student.phone,
          program: student.program,
          semester: student.semester
        });
      });

      // Estilos
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };

      const filename = `estudiantes_${Date.now()}.xlsx`;
      const filepath = path.join(this.outputDir, filename);
      await workbook.xlsx.writeFile(filepath);

      return {
        success: true,
        filename,
        path: filepath,
        count: students.length
      };
    } catch (error) {
      console.error('Error al generar Excel de estudiantes:', error);
      return {
        success: false,
        message: 'Error al generar Excel',
        error: error.message
      };
    }
  }

  /**
   * Generar CSV de lista de estudiantes
   */
  async generateStudentListCSV(filters = {}) {
    try {
      const where = {};
      if (filters.program) where.program = filters.program;
      if (filters.semester) where.semester = filters.semester;

      const students = await Student.findAll({
        where,
        include: [{ model: User, as: 'user' }],
        order: [['name', 'ASC']]
      });

      const headers = ['Documento', 'Nombre', 'Email', 'Teléfono', 'Programa', 'Semestre'];
      const rows = students.map(student => [
        student.document_number,
        student.name,
        student.user?.email || 'N/A',
        student.phone,
        student.program,
        student.semester
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const filename = `estudiantes_${Date.now()}.csv`;
      const filepath = path.join(this.outputDir, filename);
      fs.writeFileSync(filepath, csvContent, 'utf-8');

      return {
        success: true,
        filename,
        path: filepath,
        count: students.length
      };
    } catch (error) {
      console.error('Error al generar CSV de estudiantes:', error);
      return {
        success: false,
        message: 'Error al generar CSV',
        error: error.message
      };
    }
  }

  /**
   * Generar Excel de historial académico
   */
  async generateAcademicHistoryExcel(studentId) {
    try {
      const student = await Student.findByPk(studentId, {
        include: [
          { model: User, as: 'user' },
          { model: AcademicRecord, as: 'academicRecords', include: [{ model: Subject, as: 'subject' }] }
        ]
      });

      if (!student) {
        return { success: false, message: 'Estudiante no encontrado' };
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Historial Académico');

      // Información del estudiante
      worksheet.addRow(['INFORMACIÓN DEL ESTUDIANTE']);
      worksheet.addRow(['Nombre', student.name]);
      worksheet.addRow(['Documento', student.document_number]);
      worksheet.addRow(['Programa', student.program]);
      worksheet.addRow(['Semestre', student.semester]);
      worksheet.addRow([]);

      // Encabezados de tabla
      worksheet.columns = [
        { header: 'Código', key: 'code', width: 12 },
        { header: 'Materia', key: 'subject', width: 35 },
        { header: 'Créditos', key: 'credits', width: 10 },
        { header: 'Año', key: 'year', width: 10 },
        { header: 'Semestre', key: 'semester', width: 10 },
        { header: 'Nota', key: 'grade', width: 10 },
        { header: 'Estado', key: 'status', width: 15 }
      ];

      // Datos
      student.academicRecords.forEach(record => {
        worksheet.addRow({
          code: record.subject?.code || 'N/A',
          subject: record.subject?.name || 'N/A',
          credits: record.subject?.credits || 0,
          year: record.year || 'N/A',
          semester: record.semester_taken || 'N/A',
          grade: record.grade || 'N/A',
          status: this.translateStatus(record.status)
        });
      });

      // Estilos
      worksheet.getRow(1).font = { bold: true, size: 14 };
      worksheet.getRow(6).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(6).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };

      const filename = `historial_${student.document_number}_${Date.now()}.xlsx`;
      const filepath = path.join(this.outputDir, filename);
      await workbook.xlsx.writeFile(filepath);

      return {
        success: true,
        filename,
        path: filepath,
        count: student.academicRecords.length
      };
    } catch (error) {
      console.error('Error al generar Excel de historial:', error);
      return {
        success: false,
        message: 'Error al generar Excel',
        error: error.message
      };
    }
  }

  /**
   * Generar Excel de malla curricular
   */
  async generateCurriculumExcel(curriculumId) {
    try {
      const curriculum = await Curriculum.findByPk(curriculumId, {
        include: [{ model: Subject, as: 'subjects' }]
      });

      if (!curriculum) {
        return { success: false, message: 'Malla curricular no encontrada' };
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Malla Curricular');

      // Información de la malla
      worksheet.addRow(['INFORMACIÓN DEL PROGRAMA']);
      worksheet.addRow(['Programa', curriculum.program]);
      worksheet.addRow(['Versión', curriculum.version]);
      worksheet.addRow(['Créditos Totales', curriculum.total_credits]);
      worksheet.addRow(['Duración (semestres)', curriculum.duration_semesters]);
      worksheet.addRow([]);

      // Encabezados
      worksheet.columns = [
        { header: 'Semestre', key: 'semester', width: 10 },
        { header: 'Código', key: 'code', width: 12 },
        { header: 'Materia', key: 'subject', width: 35 },
        { header: 'Créditos', key: 'credits', width: 10 },
        { header: 'Tipo', key: 'type', width: 15 }
      ];

      // Datos
      curriculum.subjects.forEach(subject => {
        worksheet.addRow({
          semester: subject.semester,
          code: subject.code,
          subject: subject.name,
          credits: subject.credits,
          type: this.translateType(subject.type)
        });
      });

      // Estilos
      worksheet.getRow(1).font = { bold: true, size: 14 };
      worksheet.getRow(6).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(6).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };

      const filename = `malla_${curriculum.program}_${Date.now()}.xlsx`;
      const filepath = path.join(this.outputDir, filename);
      await workbook.xlsx.writeFile(filepath);

      return {
        success: true,
        filename,
        path: filepath,
        count: curriculum.subjects.length
      };
    } catch (error) {
      console.error('Error al generar Excel de malla:', error);
      return {
        success: false,
        message: 'Error al generar Excel',
        error: error.message
      };
    }
  }

  /**
   * Generar Excel de reporte de matrículas
   */
  async generateEnrollmentReportExcel(filters = {}) {
    try {
      const where = {};
      if (filters.program) where.program = filters.program;
      if (filters.semester) where.semester = filters.semester;

      const students = await Student.findAll({
        where,
        include: [
          { model: User, as: 'user' },
          { model: AcademicRecord, as: 'academicRecords', include: [{ model: Subject, as: 'subject' }] }
        ],
        order: [['name', 'ASC']]
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Reporte de Matrículas');

      // Encabezados
      worksheet.columns = [
        { header: 'Documento', key: 'document', width: 15 },
        { header: 'Estudiante', key: 'name', width: 30 },
        { header: 'Programa', key: 'program', width: 25 },
        { header: 'Semestre', key: 'semester', width: 10 },
        { header: 'Materias Matriculadas', key: 'enrolled', width: 20 },
        { header: 'Créditos Totales', key: 'credits', width: 15 }
      ];

      // Datos
      students.forEach(student => {
        const currentSemesterRecords = student.academicRecords.filter(
          r => r.semester_taken === student.semester
        );
        const totalCredits = currentSemesterRecords.reduce(
          (sum, r) => sum + (r.subject?.credits || 0), 0
        );

        worksheet.addRow({
          document: student.document_number,
          name: student.name,
          program: student.program,
          semester: student.semester,
          enrolled: currentSemesterRecords.length,
          credits: totalCredits
        });
      });

      // Estilos
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };

      const filename = `reporte_matriculas_${Date.now()}.xlsx`;
      const filepath = path.join(this.outputDir, filename);
      await workbook.xlsx.writeFile(filepath);

      return {
        success: true,
        filename,
        path: filepath,
        count: students.length
      };
    } catch (error) {
      console.error('Error al generar reporte de matrículas:', error);
      return {
        success: false,
        message: 'Error al generar Excel',
        error: error.message
      };
    }
  }

  /**
   * Generar Excel con datos personalizados
   */
  async generateCustomExcel(data, sheetName, columns) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(sheetName);

      // Configurar columnas
      worksheet.columns = columns;

      // Agregar datos
      data.forEach(row => {
        worksheet.addRow(row);
      });

      // Estilos
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };

      const filename = `custom_${Date.now()}.xlsx`;
      const filepath = path.join(this.outputDir, filename);
      await workbook.xlsx.writeFile(filepath);

      return {
        success: true,
        filename,
        path: filepath,
        count: data.length
      };
    } catch (error) {
      console.error('Error al generar Excel personalizado:', error);
      return {
        success: false,
        message: 'Error al generar Excel',
        error: error.message
      };
    }
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
   * Eliminar archivo exportado
   */
  async deleteExport(filename) {
    try {
      const filepath = path.join(this.outputDir, filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return { success: true, message: 'Archivo eliminado' };
      }
      return { success: false, message: 'Archivo no encontrado' };
    } catch (error) {
      return { success: false, message: 'Error al eliminar archivo', error: error.message };
    }
  }

  /**
   * Limpiar archivos antiguos (más de 7 días)
   */
  async cleanOldExports() {
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
        message: `${deletedCount} archivos antiguos eliminados`
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al limpiar archivos',
        error: error.message
      };
    }
  }

  /**
   * Obtener lista de archivos exportados
   */
  async getExportedList() {
    try {
      const files = fs.readdirSync(this.outputDir);
      const fileList = files.map(file => {
        const filepath = path.join(this.outputDir, file);
        const stats = fs.statSync(filepath);
        return {
          filename: file,
          size: stats.size,
          created: stats.mtime,
          url: `/uploads/exports/${file}`
        };
      });

      return {
        success: true,
        files: fileList.sort((a, b) => b.created - a.created)
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al obtener lista de archivos',
        error: error.message
      };
    }
  }
}

// Instancia del servicio
const fileGenerationService = new FileGenerationService();

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

// Generar Excel de lista de estudiantes
router.post('/students/excel', authenticateToken, async (req, res) => {
  try {
    const filters = req.body;
    const result = await fileGenerationService.generateStudentListExcel(filters);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      message: 'Excel generado exitosamente',
      filename: result.filename,
      url: `/uploads/exports/${path.basename(result.filename)}`,
      count: result.count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al generar Excel',
      error: error.message
    });
  }
});

// Generar CSV de lista de estudiantes
router.post('/students/csv', authenticateToken, async (req, res) => {
  try {
    const filters = req.body;
    const result = await fileGenerationService.generateStudentListCSV(filters);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      message: 'CSV generado exitosamente',
      filename: result.filename,
      url: `/uploads/exports/${path.basename(result.filename)}`,
      count: result.count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al generar CSV',
      error: error.message
    });
  }
});

// Generar Excel de historial académico
router.post('/academic-history/:studentId/excel', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await fileGenerationService.generateAcademicHistoryExcel(parseInt(studentId));

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      message: 'Excel generado exitosamente',
      filename: result.filename,
      url: `/uploads/exports/${path.basename(result.filename)}`,
      count: result.count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al generar Excel',
      error: error.message
    });
  }
});

// Generar Excel de malla curricular
router.post('/curriculum/:curriculumId/excel', authenticateToken, async (req, res) => {
  try {
    const { curriculumId } = req.params;
    const result = await fileGenerationService.generateCurriculumExcel(parseInt(curriculumId));

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      message: 'Excel generado exitosamente',
      filename: result.filename,
      url: `/uploads/exports/${path.basename(result.filename)}`,
      count: result.count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al generar Excel',
      error: error.message
    });
  }
});

// Generar Excel de reporte de matrículas
router.post('/enrollment-report/excel', authenticateToken, async (req, res) => {
  try {
    const filters = req.body;
    const result = await fileGenerationService.generateEnrollmentReportExcel(filters);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      message: 'Reporte generado exitosamente',
      filename: result.filename,
      url: `/uploads/exports/${path.basename(result.filename)}`,
      count: result.count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte',
      error: error.message
    });
  }
});

// Generar Excel personalizado
router.post('/custom/excel', authenticateToken, async (req, res) => {
  try {
    const { data, sheetName, columns } = req.body;

    const result = await fileGenerationService.generateCustomExcel(
      data,
      sheetName || 'Hoja1',
      columns
    );

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      message: 'Excel generado exitosamente',
      filename: result.filename,
      url: `/uploads/exports/${path.basename(result.filename)}`,
      count: result.count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al generar Excel',
      error: error.message
    });
  }
});

// Obtener lista de archivos exportados
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const result = await fileGenerationService.getExportedList();

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener lista de archivos',
      error: error.message
    });
  }
});

// Eliminar archivo exportado
router.delete('/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;
    const result = await fileGenerationService.deleteExport(filename);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar archivo',
      error: error.message
    });
  }
});

// Limpiar archivos antiguos (solo superadmin)
router.post('/cleanup', authenticateToken, async (req, res) => {
  try {
    const result = await fileGenerationService.cleanOldExports();

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al limpiar archivos',
      error: error.message
    });
  }
});

// ==========================================
// PARTE 3: SCRIPT INDEPENDIENTE
// ==========================================

class FileGenerationMicroservice {
  constructor() {
    this.service = fileGenerationService;
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

// ==========================================
// EXPORTS
// ==========================================

// Exportar router para usar en Express
module.exports.router = router;

// Exportar servicio para usar en el código
module.exports.service = fileGenerationService;

// Exportar clase del script independiente
module.exports.Microservice = FileGenerationMicroservice;

// Ejecutar como script independiente si se llama directamente
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
      console.log('  node FileGenerationMicroservice.js students-excel "Ingeniería de Sistemas" 5');
      console.log('  node FileGenerationMicroservice.js history 1');
    }
  }
}
