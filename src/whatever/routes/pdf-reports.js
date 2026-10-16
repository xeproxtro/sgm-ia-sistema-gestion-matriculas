const express = require('express');
const router = express.Router();
const PDFReportService = require('../Services/PDFReportService');
const path = require('path');
const { validatePDFReport } = require('../middleware/validation');

// Generar reporte de historial académico
router.post('/academic-history/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await PDFReportService.generateAcademicHistoryReport(parseInt(studentId));

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
router.post('/curriculum/:curriculumId', async (req, res) => {
  try {
    const { curriculumId } = req.params;
    const result = await PDFReportService.generateCurriculumReport(parseInt(curriculumId));

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
router.post('/enrollment-certificate/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await PDFReportService.generateEnrollmentCertificate(parseInt(studentId));

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
router.post('/student-list', validatePDFReport, async (req, res) => {
  try {
    const filters = req.body;
    const result = await PDFReportService.generateStudentListReport(filters);

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
router.delete('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const result = await PDFReportService.deleteReport(filename);

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
router.post('/cleanup', async (req, res) => {
  try {
    const result = await PDFReportService.cleanOldReports();

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

module.exports = router;
