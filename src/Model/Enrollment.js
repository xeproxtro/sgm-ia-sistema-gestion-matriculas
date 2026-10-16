const { DataTypes } = require('sequelize');
const { sequelize } = require('../whatever/Config/database');
const Student = require('./Student');
const Course = require('./Course');

const Enrollment = sequelize.define('Enrollment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Student,
      key: 'id'
    }
  },
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Course,
      key: 'id'
    }
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled'),
    defaultValue: 'pending'
  },
  enrolled_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  confirmed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  otp_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'enrollments',
  timestamps: true,
  indexes: [
    {
      fields: ['student_id']
    },
    {
      fields: ['course_id']
    },
    {
      fields: ['semester', 'year']
    },
    {
      fields: ['status']
    }
  ]
});

Enrollment.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
Enrollment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
Student.hasMany(Enrollment, { foreignKey: 'student_id', as: 'enrollments' });
Course.hasMany(Enrollment, { foreignKey: 'course_id', as: 'enrollments' });

module.exports = Enrollment;
