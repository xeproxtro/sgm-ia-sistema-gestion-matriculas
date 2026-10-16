const { DataTypes } = require('sequelize');
const { sequelize } = require('../whatever/Config/database');

const SystemLogs = sequelize.define('SystemLogs', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Acción realizada ej: LOGIN, ENROLLMENT, QUEUE_JOIN'
  },
  entity_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Tipo de entidad afectada ej: USER, ENROLLMENT, QUEUE'
  },
  entity_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID de la entidad afectada'
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Detalles adicionales de la acción'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'Dirección IP desde donde se realizó la acción'
  },
  user_agent: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'User agent del navegador'
  },
  status: {
    type: DataTypes.ENUM('success', 'error', 'warning'),
    allowNull: false,
    defaultValue: 'success'
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Mensaje de error si la acción falló'
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'system_logs',
  timestamps: false,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['action']
    },
    {
      fields: ['timestamp']
    },
    {
      fields: ['entity_type', 'entity_id']
    }
  ]
});

module.exports = SystemLogs;
