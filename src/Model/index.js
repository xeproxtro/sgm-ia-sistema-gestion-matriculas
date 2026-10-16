const { sequelize } = require('../whatever/Config/database');
const User = require('./User');
const Student = require('./Student');
const Curriculum = require('./Curriculum');
const Subject = require('./Subject');
const Course = require('./Course');
const AcademicRecord = require('./AcademicRecord');
const Queue = require('./Queue');
const Enrollment = require('./Enrollment');
const AIPreferences = require('./AIPreferences');
const SystemLogs = require('./SystemLogs');
const OTPCodes = require('./OTPCodes');

const models = {
  User,
  Student,
  Curriculum,
  Subject,
  Course,
  AcademicRecord,
  Queue,
  Enrollment,
  AIPreferences,
  SystemLogs,
  OTPCodes,
  sequelize
};

const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('Base de datos sincronizada exitosamente.');
  } catch (error) {
    console.error('Error al sincronizar la base de datos:', error);
  }
};

module.exports = { models, syncDatabase };
