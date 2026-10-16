const express = require('express');
const router = express.Router();
const { models } = require('../../Model');
const { Student, AcademicRecord, User, Subject, Curriculum } = models;

// Get student profile
router.get('/profile', async (req, res) => {
  try {
    const student = await Student.findOne({
      where: { user_id: req.user.userId },
      include: [{ model: User, as: 'user' }]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    const stats = await getStudentStats(student.id);

    res.json({
      success: true,
      student: student.toJSON(),
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil del estudiante',
      error: error.message
    });
  }
});

// Get academic history
router.get('/history', async (req, res) => {
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

    const history = await AcademicRecord.findAll({
      where: { student_id: student.id },
      include: [{ model: Subject, as: 'subject' }],
      order: [['year', 'DESC'], ['semester_taken', 'DESC']]
    });

    res.json({
      success: true,
      history: history.map(record => ({
        ...record.toJSON(),
        subject_code: record.subject?.code,
        subject_name: record.subject?.name,
        credits: record.subject?.credits
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial académico',
      error: error.message
    });
  }
});

// Update student profile
router.put('/profile', async (req, res) => {
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

    await student.update(req.body);

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      student: student.toJSON()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil',
      error: error.message
    });
  }
});

async function getStudentStats(studentId) {
  const records = await AcademicRecord.findAll({
    where: { student_id: studentId }
  });

  const creditsCompleted = records
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + (r.subject?.credits || 0), 0);

  const pendingSubjects = records.filter(r => 
    r.status === 'failed' || r.status === 'cancelled'
  ).length;

  const approvedCount = records.filter(r => r.status === 'approved').length;
  const failedCount = records.filter(r => r.status === 'failed').length;
  const totalGraded = approvedCount + failedCount;
  
  const gpa = totalGraded > 0 
    ? (records.reduce((sum, r) => sum + (r.grade || 0), 0) / totalGraded).toFixed(2)
    : '0.00';

  return {
    credits_completed: creditsCompleted,
    pending_subjects: pendingSubjects,
    gpa: parseFloat(gpa)
  };
}

// Get student curriculum
router.get('/curriculum', async (req, res) => {
  try {
    const student = await Student.findOne({
      where: { user_id: req.user.userId },
      include: [{ model: User, as: 'user' }]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    // Get curriculum based on student's program
    const curriculum = await Curriculum.findOne({
      where: { 
        program: student.program,
        is_active: true
      },
      include: [{ model: Subject, as: 'subjects' }]
    });

    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: 'Malla curricular no encontrada'
      });
    }

    // Get student's academic records to determine subject status
    const records = await AcademicRecord.findAll({
      where: { student_id: student.id }
    });

    // Add status to subjects
    const subjectsWithStatus = curriculum.subjects.map(subject => {
      const record = records.find(r => r.subject_id === subject.id);
      return {
        ...subject.toJSON(),
        status: record ? record.status : 'pending',
        grade: record ? record.grade : null,
        file_name: record ? record.file_name : null
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
    console.error('Error loading curriculum:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar malla curricular',
      error: error.message
    });
  }
});

// Get electives and optional subjects
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

    // Get curriculum to find electives
    const curriculum = await Curriculum.findOne({
      where: { 
        program: student.program,
        is_active: true
      },
      include: [{ model: Subject, as: 'subjects' }]
    });

    if (!curriculum) {
      return res.json({
        success: true,
        electives: []
      });
    }

    // Filter only elective and optional subjects
    const electives = curriculum.subjects.filter(subject => 
      subject.type === 'elective' || subject.type === 'optional'
    );

    res.json({
      success: true,
      electives: electives.map(e => e.toJSON())
    });
  } catch (error) {
    console.error('Error loading electives:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cargar electivas',
      error: error.message
    });
  }
});

module.exports = router;
