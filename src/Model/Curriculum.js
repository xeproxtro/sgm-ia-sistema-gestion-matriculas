const { DataTypes } = require('sequelize');
const { sequelize } = require('../whatever/Config/database');

const Curriculum = sequelize.define('Curriculum', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  program: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  version: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  total_credits: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  duration_semesters: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  tableName: 'curricula',
  timestamps: true,
  indexes: [
    {
      fields: ['program']
    },
    {
      fields: ['is_active']
    }
  ]
});

module.exports = Curriculum;
