const { DataTypes } = require('sequelize');
const { sequelize } = require('../whatever/Config/database');

const OTPCodes = sequelize.define('OTPCodes', {
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
  code: {
    type: DataTypes.STRING(6),
    allowNull: false
  },
  purpose: {
    type: DataTypes.ENUM('login', 'enrollment', 'password_reset'),
    allowNull: false,
    defaultValue: 'login'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  is_used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  used_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Número de intentos fallidos'
  }
}, {
  tableName: 'otp_codes',
  timestamps: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['code']
    },
    {
      fields: ['expires_at']
    }
  ]
});

module.exports = OTPCodes;
