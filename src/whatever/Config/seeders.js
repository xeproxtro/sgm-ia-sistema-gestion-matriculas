const bcrypt = require('bcryptjs');
const { sequelize } = require('./database');
const { models } = require('../../Model');
const { User, Student, Curriculum, Subject, Course, AIPreferences, SystemLogs, OTPCodes } = models;

const seedDatabase = async () => {
  try {
    console.log('Iniciando seeders de base de datos...');
    
    // Sincronizar base de datos
    await sequelize.sync({ force: true });
    console.log('Base de datos sincronizada');

    // Hash de contraseñas
    const superAdminPassword = await bcrypt.hash('d4clt//waos123', 10);
    const adminPassword = await bcrypt.hash('akirayyukimishijoswe12', 10);
    const studentPassword = await bcrypt.hash('nosexdwaos123', 10);

    // Crear Super Administrador
    const superAdmin = await User.create({
      document_number: '1000000001',
      name: 'Emmanuel Moreno Rueda',
      email: 'emmanuelmoreno@uts.edu.co',
      phone: '+573000000001',
      role: 'superadmin',
      password_hash: superAdminPassword,
      is_active: true
    });
    console.log('✅ Super Administrador creado: emmanuelmoreno@uts.edu.co');

    // Crear Administrador del Sistema
    const admin = await User.create({
      document_number: '1000000002',
      name: 'Admin Sistema UTS',
      email: 'emmanuelmoreno2t@gmail.com',
      phone: '+573000000002',
      role: 'admin',
      password_hash: adminPassword,
      is_active: true
    });
    console.log('✅ Administrador creado: emmanuelmoreno2t@gmail.com');

    // Crear Estudiante
    const studentUser = await User.create({
      document_number: '1000000003',
      name: 'Estudiante Prueba',
      email: 'waosmanxd123@gmail.com',
      phone: '+573000000003',
      role: 'student',
      password_hash: studentPassword,
      is_active: true
    });

    const student = await Student.create({
      user_id: studentUser.id,
      student_code: '20260001',
      program: 'Ingeniería de Sistemas',
      semester: 1,
      academic_status: 'active',
      credits_completed: 0,
      gpa: 0.0,
      priority_score: 0
    });
    console.log('✅ Estudiante creado: waosmanxd123@gmail.com');

    // Crear malla curricular de ejemplo
    const curriculum = await Curriculum.create({
      program: 'Ingeniería de Sistemas',
      version: '2024-1',
      total_credits: 160,
      duration_semesters: 10,
      is_active: true
    });
    console.log('✅ Malla curricular creada: Ingeniería de Sistemas');

    // Crear materias de ejemplo
    const subjects = await Subject.bulkCreate([
      {
        code: 'IS101',
        name: 'Programación I',
        credits: 4,
        type: 'mandatory',
        semester: 1,
        prerequisites: null,
        curriculum_id: curriculum.id
      },
      {
        code: 'IS102',
        name: 'Estructuras de Datos',
        credits: 4,
        type: 'mandatory',
        semester: 2,
        prerequisites: 'IS101',
        curriculum_id: curriculum.id
      },
      {
        code: 'IS201',
        name: 'Bases de Datos',
        credits: 4,
        type: 'mandatory',
        semester: 3,
        prerequisites: 'IS102',
        curriculum_id: curriculum.id
      },
      {
        code: 'IS202',
        name: 'Ingeniería de Software',
        credits: 4,
        type: 'mandatory',
        semester: 4,
        prerequisites: 'IS201',
        curriculum_id: curriculum.id
      },
      {
        code: 'IS301',
        name: 'Inteligencia Artificial',
        credits: 4,
        type: 'mandatory',
        semester: 5,
        prerequisites: 'IS202',
        curriculum_id: curriculum.id
      },
      {
        code: 'EL101',
        name: 'Electiva: Emprendimiento',
        credits: 3,
        type: 'elective',
        semester: 6,
        prerequisites: null,
        curriculum_id: curriculum.id
      },
      {
        code: 'OP101',
        name: 'Optativa: Desarrollo Web',
        credits: 3,
        type: 'optional',
        semester: 7,
        prerequisites: 'IS102',
        curriculum_id: curriculum.id
      }
    ]);
    console.log('✅ Materias creadas: 7 materias');

    // Crear cursos de ejemplo
    const courses = await Course.bulkCreate([
      {
        subject_id: subjects[0].id,
        group_number: '01',
        teacher: 'Dr. Carlos Pineda',
        schedule: {
          days: ['Lunes', 'Miércoles'],
          times: ['08:00-10:00', '14:00-16:00']
        },
        classroom: 'A101',
        capacity: 40,
        enrolled: 25,
        is_available: true
      },
      {
        subject_id: subjects[1].id,
        group_number: '01',
        teacher: 'Dra. María González',
        schedule: {
          days: ['Martes', 'Jueves'],
          times: ['10:00-12:00', '16:00-18:00']
        },
        classroom: 'A102',
        capacity: 35,
        enrolled: 30,
        is_available: true
      },
      {
        subject_id: subjects[2].id,
        group_number: '01',
        teacher: 'Dr. Juan Pérez',
        schedule: {
          days: ['Lunes', 'Miércoles', 'Viernes'],
          times: ['09:00-11:00']
        },
        classroom: 'B201',
        capacity: 30,
        enrolled: 28,
        is_available: true
      },
      {
        subject_id: subjects[4].id,
        group_number: '01',
        teacher: 'Dr. Emmanuel Moreno',
        schedule: {
          days: ['Martes', 'Jueves'],
          times: ['14:00-16:00', '16:00-18:00']
        },
        classroom: 'C301',
        capacity: 25,
        enrolled: 20,
        is_available: true
      }
    ]);
    console.log('✅ Cursos creados: 4 cursos');

    // Crear registros académicos de ejemplo para el estudiante (estudiante nuevo, sin materias aprobadas)
    const { AcademicRecord } = models;
    await AcademicRecord.bulkCreate([
      // Estudiante de primer semestre, sin historial académico todavía
    ]);
    console.log('✅ Historial académico creado para estudiante (nuevo, sin materias)');

    // Crear preferencias de IA para el estudiante
    await AIPreferences.create({
      user_id: studentUser.id,
      preferred_time_slots: ['08:00-10:00', '14:00-16:00'],
      avoid_days: ['Sábado'],
      max_daily_hours: 6,
      preferred_teachers: [],
      priority_subjects: ['IS301', 'IS202'],
      optimization_goal: 'balanced',
      ai_suggestions_history: [],
      last_optimization_date: null
    });
    console.log('✅ Preferencias de IA creadas para estudiante');

    // Crear logs de sistema de ejemplo
    await SystemLogs.bulkCreate([
      {
        user_id: superAdmin.id,
        action: 'USER_CREATED',
        entity_type: 'USER',
        entity_id: superAdmin.id,
        details: { role: 'superadmin' },
        ip_address: '127.0.0.1',
        status: 'success'
      },
      {
        user_id: admin.id,
        action: 'USER_CREATED',
        entity_type: 'USER',
        entity_id: admin.id,
        details: { role: 'admin' },
        ip_address: '127.0.0.1',
        status: 'success'
      },
      {
        user_id: studentUser.id,
        action: 'USER_CREATED',
        entity_type: 'USER',
        entity_id: studentUser.id,
        details: { role: 'student' },
        ip_address: '127.0.0.1',
        status: 'success'
      },
      {
        user_id: studentUser.id,
        action: 'ACADEMIC_RECORD_CREATED',
        entity_type: 'ACADEMIC_RECORD',
        details: { records_count: 4 },
        ip_address: '127.0.0.1',
        status: 'success'
      }
    ]);
    console.log('✅ Logs de sistema creados');

    // Crear códigos OTP de ejemplo (expirados para prueba)
    await OTPCodes.create({
      user_id: studentUser.id,
      code: '123456',
      purpose: 'login',
      expires_at: new Date(Date.now() - 1000),
      is_used: true,
      used_at: new Date(Date.now() - 2000),
      ip_address: '127.0.0.1',
      attempts: 0
    });
    console.log('✅ Códigos OTP de prueba creados');

    console.log('🎉 Seeders completados exitosamente');
    console.log('');
    console.log('📋 Credenciales de prueba:');
    console.log('=====================================');
    console.log('🔑 Super Administrador:');
    console.log('   Email: emmanuelmoreno@uts.edu.co');
    console.log('   Password: d4clt//waos123');
    console.log('');
    console.log('🔑 Administrador:');
    console.log('   Email: emmanuelmoreno2t@gmail.com');
    console.log('   Password: akirayyukimishijoswe12');
    console.log('');
    console.log('🔑 Estudiante:');
    console.log('   Email: waosmanxd123@gmail.com');
    console.log('   Password: nosexdwaos123');
    console.log('=====================================');

  } catch (error) {
    console.error('❌ Error en seeders:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

// Ejecutar seeders
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
