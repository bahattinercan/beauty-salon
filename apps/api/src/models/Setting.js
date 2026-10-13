const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Admin panel ayarları: key/value JSON olarak saklanır.
const Setting = sequelize.define('Setting', {
  key: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  value: {
    type: DataTypes.JSON,
    allowNull: false,
  },
}, {
  tableName: 'settings',
  timestamps: true,
  updatedAt: false,
});

module.exports = Setting;
