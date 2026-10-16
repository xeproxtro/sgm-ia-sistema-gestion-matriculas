const { DataTypes } = require('sequelize');
const { sequelize } = require('../whatever/Config/database');

const Subject = sequelize.define('Subject', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  credits: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 6
    }
  },
  type: {
    type: DataTypes.ENUM('mandatory', 'elective', 'optional'),
    defaultValue: 'mandatory'
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  prerequisites: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  curriculum_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  file_path: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  file_type: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  file_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'subjects',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['code']
    },
    {
      fields: ['curriculum_id']
    },
    {
      fields: ['type']
    }
  ]
});

module.exports = Subject;
