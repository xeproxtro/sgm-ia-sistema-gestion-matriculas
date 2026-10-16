const { DataTypes } = require('sequelize');
const { sequelize } = require('../whatever/Config/database');
const Student = require('./Student');

const Queue = sequelize.define('Queue', {
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
  batch_number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  position_in_batch: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('waiting', 'active', 'completed', 'skipped'),
    defaultValue: 'waiting'
  },
  entered_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  activated_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'queues',
  timestamps: true,
  indexes: [
    {
      fields: ['student_id']
    },
    {
      fields: ['batch_number']
    },
    {
      fields: ['status']
    }
  ]
});

Queue.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
Student.hasOne(Queue, { foreignKey: 'student_id', as: 'queue' });

module.exports = Queue;
