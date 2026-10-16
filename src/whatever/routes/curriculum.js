const express = require('express');
const router = express.Router();
const { models } = require('../../Model');
const { Curriculum, Subject, Student, AcademicRecord } = models;
const { upload, handleUploadError } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

// Get student curriculum
router.get('/student', async (req, res) => {
  try {
    const student = await Student.findOne({
      where: { user_id: req.user.userId }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    const curriculum = await Curriculum.findOne({
      where: { 
        program: student.program,
        is_active: true
      }
    });

    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Malla curricular no encontrada'
      });
    }

    const subjects = await Subject.findAll({
      where: { curriculum_id: curriculum.id },
      order: [['semester', 'ASC'], ['name', 'ASC']]
    });

    const academicRecords = await AcademicRecord.findAll({
      where: { student_id: student.id }
    });

    const subjectsWithStatus = subjects.map(subject => {
      const record = academicRecords.find(r => r.subject_id === subject.id);
      return {
        ...subject.toJSON(),
        status: record ? record.status : 'pending',
        grade: record ? record.grade : null
      };
    });

    res.json({
      success: true,
      curriculum: {
        ...curriculum.toJSON(),
        subjects: subjectsWithStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener malla curricular',
      error: error.message
    });
  }
});

// Get elective subjects
router.get('/electives', async (req, res) => {
  try {
    const student = await Student.findOne({
      where: { user_id: req.user.userId }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    const curriculum = await Curriculum.findOne({
      where: { 
        program: student.program,
        is_active: true
      }
    });

    const electives = await Subject.findAll({
      where: { 
        curriculum_id: curriculum ? curriculum.id : null,
        type: ['elective', 'optional']
      },
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      electives: electives.map(e => e.toJSON())
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener electivas',
      error: error.message
    });
  }
});

// Get subject details
router.get('/subject/:subjectId', async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    const subject = await Subject.findByPk(subjectId, {
      include: [{ model: Curriculum, as: 'curriculum' }]
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Materia no encontrada'
      });
    }

    res.json({
      success: true,
      subject: subject.toJSON()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalles de materia',
      error: error.message
    });
  }
});

// Search subjects
router.get('/search', async (req, res) => {
  try {
    const { query, type, semester } = req.query;
    
    const whereClause = {};
    
    if (query) {
      whereClause.name = {
        [require('sequelize').Op.like]: `%${query}%`
      };
    }
    
    if (type) {
      whereClause.type = type;
    }
    
    if (semester) {
      whereClause.semester = semester;
    }

    const subjects = await Subject.findAll({
      where: whereClause,
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      subjects: subjects.map(s => s.toJSON())
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al buscar materias',
      error: error.message
    });
  }
});

// Upload file for curriculum (admin/superadmin only)
router.post('/curriculum/:curriculumId/file', upload.single('file'), handleUploadError, async (req, res) => {
  try {
    const { curriculumId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
    }

    const curriculum = await Curriculum.findByPk(curriculumId);
    if (!curriculum) {
      // Eliminar el archivo si no se encuentra el curriculum
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Malla curricular no encontrada'
      });
    }

    // Eliminar archivo anterior si existe
    if (curriculum.file_path && fs.existsSync(curriculum.file_path)) {
      fs.unlinkSync(curriculum.file_path);
    }

    await curriculum.update({
      file_path: req.file.path,
      file_type: req.file.mimetype,
      file_name: req.file.originalname
    });

    res.json({
      success: true,
      message: 'Archivo cargado exitosamente',
      curriculum: curriculum.toJSON()
    });
  } catch (error) {
    // Eliminar archivo si hay error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'Error al cargar archivo',
      error: error.message
    });
  }
});

// Upload file for subject (admin/superadmin only)
router.post('/subject/:subjectId/file', upload.single('file'), handleUploadError, async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
    }

    const subject = await Subject.findByPk(subjectId);
    if (!subject) {
      // Eliminar el archivo si no se encuentra la materia
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Materia no encontrada'
      });
    }

    // Eliminar archivo anterior si existe
    if (subject.file_path && fs.existsSync(subject.file_path)) {
      fs.unlinkSync(subject.file_path);
    }

    await subject.update({
      file_path: req.file.path,
      file_type: req.file.mimetype,
      file_name: req.file.originalname
    });

    res.json({
      success: true,
      message: 'Archivo cargado exitosamente',
      subject: subject.toJSON()
    });
  } catch (error) {
    // Eliminar archivo si hay error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'Error al cargar archivo',
      error: error.message
    });
  }
});

// Serve file for curriculum (accessible by students during maintenance)
router.get('/curriculum/:curriculumId/file', async (req, res) => {
  try {
    const { curriculumId } = req.params;
    
    const curriculum = await Curriculum.findByPk(curriculumId);
    if (!curriculum || !curriculum.file_path) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado'
      });
    }

    if (!fs.existsSync(curriculum.file_path)) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no existe en el servidor'
      });
    }

    res.sendFile(path.resolve(curriculum.file_path));
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al servir archivo',
      error: error.message
    });
  }
});

// Serve file for subject (accessible by students during maintenance)
router.get('/subject/:subjectId/file', async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    const subject = await Subject.findByPk(subjectId);
    if (!subject || !subject.file_path) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado'
      });
    }

    if (!fs.existsSync(subject.file_path)) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no existe en el servidor'
      });
    }

    res.sendFile(path.resolve(subject.file_path));
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al servir archivo',
      error: error.message
    });
  }
});

// Delete file from curriculum (admin/superadmin only)
router.delete('/curriculum/:curriculumId/file', async (req, res) => {
  try {
    const { curriculumId } = req.params;
    
    const curriculum = await Curriculum.findByPk(curriculumId);
    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Malla curricular no encontrada'
      });
    }

    // Eliminar archivo si existe
    if (curriculum.file_path && fs.existsSync(curriculum.file_path)) {
      fs.unlinkSync(curriculum.file_path);
    }

    await curriculum.update({
      file_path: null,
      file_type: null,
      file_name: null
    });

    res.json({
      success: true,
      message: 'Archivo eliminado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar archivo',
      error: error.message
    });
  }
});

// Delete file from subject (admin/superadmin only)
router.delete('/subject/:subjectId/file', async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    const subject = await Subject.findByPk(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Materia no encontrada'
      });
    }

    // Eliminar archivo si existe
    if (subject.file_path && fs.existsSync(subject.file_path)) {
      fs.unlinkSync(subject.file_path);
    }

    await subject.update({
      file_path: null,
      file_type: null,
      file_name: null
    });

    res.json({
      success: true,
      message: 'Archivo eliminado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar archivo',
      error: error.message
    });
  }
});

module.exports = router;
