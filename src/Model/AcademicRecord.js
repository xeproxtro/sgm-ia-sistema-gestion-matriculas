const { DataTypes } = require('sequelize');
const { sequelize } = require('../whatever/Config/database');
const Student = require('./Student');
const Subject = require('./Subject');

const AcademicRecord = sequelize.define('AcademicRecord', {
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
  subject_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Subject,
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('approved', 'failed', 'cancelled', 'in_progress'),
    allowNull: false
  },
  grade: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true
  },
  semester_taken: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'academic_records',
  timestamps: true,
  indexes: [
    {
      fields: ['student_id']
    },
    {
      fields: ['subject_id']
    },
    {
      fields: ['status']
    }
  ]
});

AcademicRecord.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
AcademicRecord.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });
Student.hasMany(AcademicRecord, { foreignKey: 'student_id', as: 'academic_records' });
Subject.hasMany(AcademicRecord, { foreignKey: 'subject_id', as: 'academic_records' });

module.exports = AcademicRecord;
