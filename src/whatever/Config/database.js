const { Sequelize } = require('sequelize');
require('dotenv').config();

// Determinar si usar MySQL o SQLite basado en variables de entorno
const useMySQL = process.env.DB_HOST && process.env.DB_NAME;

const sequelize = useMySQL
  ? new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        define: {
          timestamps: true,
          underscored: true
        }
      }
    )
  : new Sequelize({
      dialect: 'sqlite',
      storage: './database.sqlite',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      define: {
        timestamps: true,
        underscored: true
      }
    });

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a base de datos establecida exitosamente.');
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
  }
};

module.exports = { sequelize, testConnection };
