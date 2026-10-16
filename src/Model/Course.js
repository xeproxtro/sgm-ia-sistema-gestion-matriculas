const { DataTypes } = require('sequelize');
const { sequelize } = require('../whatever/Config/database');
const Subject = require('./Subject');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  subject_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Subject,
      key: 'id'
    }
  },
  group_number: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  teacher: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  schedule: {
    type: DataTypes.JSON,
    allowNull: false
  },
  classroom: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 40
  },
  enrolled: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'courses',
  timestamps: true,
  indexes: [
    {
      fields: ['subject_id']
    },
    {
      fields: ['is_available']
    }
  ]
});

Course.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });
Subject.hasMany(Course, { foreignKey: 'subject_id', as: 'courses' });

module.exports = Course;
