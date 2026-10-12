const { Sequelize } = require('sequelize');
const path = require('path');

// Use test database when in test environment
const dbStorage = process.env.NODE_ENV === 'test'
  ? path.join(__dirname, '..', 'test-database.sqlite')
  : path.join(__dirname, '..', 'database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbStorage,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    underscored: true,
    timestamps: true,
  },
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('SQLite bağlantısı başarılı');
  } catch (error) {
    console.error('Veritabanı bağlantı hatası:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
