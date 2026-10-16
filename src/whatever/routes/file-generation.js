const express = require('express');
const router = express.Router();
const FileGenerationService = require('../Services/FileGenerationService');
const path = require('path');
const { validateFileGeneration, validateCustomExcel } = require('../middleware/validation');

// Generar Excel de lista de estudiantes
router.post('/students/excel', validateFileGeneration, async (req, res) => {
  try {
    const filters = req.body;
    const result = await FileGenerationService.generateStudentListExcel(filters);

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
router.post('/students/csv', validateFileGeneration, async (req, res) => {
  try {
    const filters = req.body;
    const result = await FileGenerationService.generateStudentListCSV(filters);

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
router.post('/academic-history/:studentId/excel', async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await FileGenerationService.generateAcademicHistoryExcel(parseInt(studentId));

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
router.post('/curriculum/:curriculumId/excel', async (req, res) => {
  try {
    const { curriculumId } = req.params;
    const result = await FileGenerationService.generateCurriculumExcel(parseInt(curriculumId));

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
router.post('/enrollment-report/excel', validateFileGeneration, async (req, res) => {
  try {
    const filters = req.body;
    const result = await FileGenerationService.generateEnrollmentReportExcel(filters);

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
router.post('/custom/excel', validateCustomExcel, async (req, res) => {
  try {
    const { data, sheetName, columns } = req.body;

    const result = await FileGenerationService.generateCustomExcel(
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
router.get('/list', async (req, res) => {
  try {
    const result = await FileGenerationService.getExportedList();

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
router.delete('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const result = await FileGenerationService.deleteExport(filename);

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
router.post('/cleanup', async (req, res) => {
  try {
    const result = await FileGenerationService.cleanOldExports();

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

module.exports = router;
