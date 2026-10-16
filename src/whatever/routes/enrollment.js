const express = require('express');
const router = express.Router();
const { models } = require('../../Model');
const { Enrollment, Student, Course, Subject } = models;
const AuthService = require('../Services/AuthService');

// Get available subjects for enrollment
router.get('/available-subjects', async (req, res) => {
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

    const courses = await Course.findAll({
      where: { is_available: true },
      include: [{ model: Subject, as: 'subject' }],
      order: [['subject_id', 'ASC']]
    });

    const subjects = courses.map(course => ({
      id: course.id,
      code: course.subject?.code,
      name: course.subject?.name,
      credits: course.subject?.credits,
      group_number: course.group_number,
      teacher: course.teacher,
      capacity: course.capacity,
      enrolled: course.enrolled,
      schedule: course.schedule
    }));

    res.json({
      success: true,
      subjects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener materias disponibles',
      error: error.message
    });
  }
});

// Enroll in a course
router.post('/enroll', async (req, res) => {
  try {
    const { course_id } = req.body;
    
    const student = await Student.findOne({
      where: { user_id: req.user.userId }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    const course = await Course.findByPk(course_id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Curso no encontrado'
      });
    }

    if (course.enrolled >= course.capacity) {
      return res.status(400).json({
        success: false,
        message: 'No hay cupos disponibles'
      });
    }

    // Create enrollment directly without OTP
    const enrollment = await Enrollment.create({
      student_id: student.id,
      course_id: course_id,
      semester: student.semester,
      year: new Date().getFullYear(),
      status: 'confirmed',
      confirmed_at: new Date(),
      otp_verified: true
    });

    // Update course enrollment count
    await course.update({ enrolled: course.enrolled + 1 });

    res.json({
      success: true,
      message: 'Matrícula realizada exitosamente',
      enrollment: enrollment.toJSON()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al realizar matrícula',
      error: error.message
    });
  }
});

// Confirm enrollment with OTP
router.post('/confirm-otp', async (req, res) => {
  try {
    const { otp } = req.body;
    
    // Verify OTP
    const otpResult = await AuthService.verifyEnrollmentOTP(req.user.userId, otp);
    
    if (!otpResult.success) {
      return res.status(400).json({
        success: false,
        message: otpResult.message
      });
    }

    // Process pending enrollment
    const pendingEnrollment = req.session?.pendingEnrollment;
    if (!pendingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'No hay matrícula pendiente'
      });
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      ...pendingEnrollment,
      status: 'confirmed',
      confirmed_at: new Date(),
      otp_verified: true
    });

    // Update course enrollment count
    const course = await Course.findByPk(pendingEnrollment.course_id);
    if (course) {
      await course.update({ enrolled: course.enrolled + 1 });
    }

    // Clear pending enrollment
    delete req.session.pendingEnrollment;

    res.json({
      success: true,
      message: 'Matrícula confirmada exitosamente',
      enrollment: enrollment.toJSON()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al confirmar matrícula',
      error: error.message
    });
  }
});

// Get current enrollments
router.get('/current', async (req, res) => {
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

    const enrollments = await Enrollment.findAll({
      where: { 
        student_id: student.id,
        status: 'confirmed'
      },
      include: [{ 
        model: Course, 
        as: 'course',
        include: [{ model: Subject, as: 'subject' }]
      }],
      order: [['semester', 'DESC'], ['year', 'DESC']]
    });

    res.json({
      success: true,
      enrollments: enrollments.map(e => ({
        ...e.toJSON(),
        subject_name: e.course?.subject?.name,
        subject_code: e.course?.subject?.code,
        teacher: e.course?.teacher,
        schedule: e.course?.schedule,
        classroom: e.course?.classroom
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener matrículas actuales',
      error: error.message
    });
  }
});

// Cancel enrollment
router.delete('/:enrollmentId', async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    
    const student = await Student.findOne({
      where: { user_id: req.user.userId }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    const enrollment = await Enrollment.findOne({
      where: { 
        id: enrollmentId,
        student_id: student.id
      }
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Matrícula no encontrada'
      });
    }

    // Update course enrollment count
    const course = await Course.findByPk(enrollment.course_id);
    if (course && course.enrolled > 0) {
      await course.update({ enrolled: course.enrolled - 1 });
    }

    await enrollment.update({ status: 'cancelled' });

    res.json({
      success: true,
      message: 'Matrícula cancelada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al cancelar matrícula',
      error: error.message
    });
  }
});

module.exports = router;
