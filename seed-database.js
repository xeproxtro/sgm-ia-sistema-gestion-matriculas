const bcrypt = require('bcryptjs');
const { sequelize } = require('./src/whatever/Config/database');
const { models } = require('./src/Model');
const { User, Student } = models;

async function seedDatabase() {
  try {
    await sequelize.sync({ force: true });
    console.log('Base de datos sincronizada');

    // Crear usuarios de prueba
    const users = [
      {
        document_number: '123456789',
        name: 'Emmanuel Moreno (Super Admin)',
        email: 'emmanuelmoreno@uts.edu.co',
        phone: '3101234567',
        role: 'superadmin',
        password: 'd4clt//waos123',
        is_active: true
      },
      {
        document_number: '987654321',
        name: 'Emmanuel Moreno (Admin)',
        email: 'emmanuelmoreno2t@gmail.com',
        phone: '3119876543',
        role: 'admin',
        password: 'akirayyukimishijoswe12',
        is_active: true
      },
      {
        document_number: '456789123',
        name: 'Estudiante Prueba',
        email: 'waosmanxd123@gmail.com',
        phone: '3204567890',
        role: 'student',
        password: 'nosexdwaos123',
        is_active: true
      }
    ];

    for (const userData of users) {
      const passwordHash = await bcrypt.hash(userData.password, 10);
      const user = await User.create({
        document_number: userData.document_number,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        password_hash: passwordHash,
        is_active: userData.is_active
      });

      if (userData.role === 'student') {
        await Student.create({
          user_id: user.id,
          student_code: `STU${userData.document_number}`,
          program: 'Ingeniería de Sistemas',
          semester: 5
        });
      }

      console.log(`Usuario creado: ${userData.email} (${userData.role})`);
    }

    console.log('Base de datos poblada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('Error al poblar base de datos:', error);
    process.exit(1);
  }
}

seedDatabase();