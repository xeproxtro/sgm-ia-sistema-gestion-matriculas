const { DataTypes } = require('sequelize');
const { sequelize } = require('../whatever/Config/database');

const AIPreferences = sequelize.define('AIPreferences', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  preferred_time_slots: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array de franjas horarias preferidas ej: ["08:00-10:00", "14:00-16:00"]'
  },
  avoid_days: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Días a evitar ej: ["Viernes"]'
  },
  max_daily_hours: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 6,
    comment: 'Máximo de horas de clase por día'
  },
  preferred_teachers: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array de IDs de profesores preferidos'
  },
  priority_subjects: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Materias prioritarias para el estudiante'
  },
  optimization_goal: {
    type: DataTypes.ENUM('balanced', 'minimize_days', 'compact_schedule', 'spread_out'),
    allowNull: true,
    defaultValue: 'balanced',
    comment: 'Objetivo de optimización de horario'
  },
  ai_suggestions_history: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Historial de sugerencias generadas por IA'
  },
  last_optimization_date: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'ai_preferences',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id']
    }
  ]
});

module.exports = AIPreferences;
