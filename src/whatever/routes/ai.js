const express = require('express');
const router = express.Router();
const AIService = require('../Services/AIService');
const { models } = require('../../Model');
const { Student, AcademicRecord, Course, Subject } = models;

// Query AI assistant
router.post('/query', async (req, res) => {
  try {
    const { query } = req.body;
    
    const student = await Student.findOne({
      where: { user_id: req.user.userId },
      include: [{ model: AcademicRecord, as: 'academic_records' }]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    const studentData = {
      program: student.program,
      currentSemester: student.semester,
      gpa: student.gpa,
      academicRecord: student.academic_records || []
    };

    const result = await AIService.getAcademicAdvice(studentData, query);
    
    console.log('🔍 AI Result:', JSON.stringify(result, null, 2));
    console.log('🔍 Advice type:', typeof result.advice);
    console.log('🔍 Advice value:', result.advice);
    
    if (result.success) {
      // Asegurarse de que la respuesta sea solo texto limpio
      let cleanResponse = result.advice;
      if (typeof cleanResponse === 'object') {
        cleanResponse = JSON.stringify(cleanResponse);
      }
      
      // Eliminar metadatos de seguridad si están presentes
      if (typeof cleanResponse === 'string') {
        cleanResponse = cleanResponse.replace(/User Safety: safe/gi, '').trim();
      }
      
      res.json({
        success: true,
        response: cleanResponse
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al obtener respuesta de IA',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error en AI query:', error);
    console.error('Error details:', error.toString());
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error al procesar consulta de IA',
      error: error.message,
      details: error.toString(),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get schedule suggestions
router.get('/schedule-suggestions', async (req, res) => {
  try {
    const student = await Student.findOne({
      where: { user_id: req.user.userId },
      include: [{ model: AcademicRecord, as: 'academic_records' }]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    const availableCourses = await Course.findAll({
      where: { is_available: true },
      include: [{ model: Subject, as: 'subject' }]
    });

    const studentData = {
      program: student.program,
      currentSemester: student.semester,
      gpa: student.gpa,
      academicRecord: student.academic_records.map(record => ({
        status: record.status,
        subject_name: record.subject?.name || 'Unknown'
      })),
      creditsCompleted: student.credits_completed
    };

    const coursesData = availableCourses.map(course => ({
      code: course.subject?.code,
      subject_name: course.subject?.name,
      credits: course.subject?.credits,
      group_number: course.group_number,
      schedule: course.schedule,
      capacity: course.capacity,
      enrolled: course.enrolled
    }));

    const result = await AIService.optimizeSchedule(studentData, coursesData);
    
    if (result.success) {
      res.json({
        success: true,
        suggestions: result.suggestions
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al obtener sugerencias de horario',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener sugerencias de horario',
      error: error.message
    });
  }
});

// Optimize specific schedule selection
router.post('/optimize-schedule', async (req, res) => {
  try {
    const { selectedCourses } = req.body;
    
    const student = await Student.findOne({
      where: { user_id: req.user.userId },
      include: [{ model: AcademicRecord, as: 'academic_records' }]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    const courses = await Course.findAll({
      where: { 
        id: selectedCourses,
        is_available: true
      },
      include: [{ model: Subject, as: 'subject' }]
    });

    const studentData = {
      program: student.program,
      currentSemester: student.semester,
      gpa: student.gpa,
      academicRecord: student.academic_records.map(record => ({
        status: record.status,
        subject_name: record.subject?.name || 'Unknown'
      }))
    };

    const coursesData = courses.map(course => ({
      code: course.subject?.code,
      subject_name: course.subject?.name,
      credits: course.subject?.credits,
      group_number: course.group_number,
      schedule: course.schedule
    }));

    const result = await AIService.optimizeSchedule(studentData, coursesData);
    
    if (result.success) {
      res.json({
        success: true,
        analysis: result.suggestions,
        conflicts: result.suggestions[0]?.schedule_conflicts || [],
        deadTime: result.suggestions[0]?.dead_time_hours || 0
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al optimizar horario',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al optimizar horario',
      error: error.message
    });
  }
});

module.exports = router;
