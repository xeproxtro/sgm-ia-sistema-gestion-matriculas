const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { models } = require('../../Model');
const { Student, AcademicRecord, Subject, Curriculum, User } = models;

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

module.exports = new FileGenerationService();
