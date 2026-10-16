const { DataTypes } = require('sequelize');
const { sequelize } = require('../whatever/Config/database');
const User = require('./User');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  student_code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  program: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 10
    }
  },
  academic_status: {
    type: DataTypes.ENUM('active', 'suspended', 'graduated', 'withdrawn'),
    defaultValue: 'active'
  },
  credits_completed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  gpa: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0.00
  },
  priority_score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'students',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['student_code']
    },
    {
      fields: ['program']
    },
    {
      fields: ['semester']
    }
  ]
});

Student.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasOne(Student, { foreignKey: 'user_id', as: 'student' });

module.exports = Student;
