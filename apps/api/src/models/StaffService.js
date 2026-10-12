const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StaffService = sequelize.define('StaffService', {
  staffId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'staff_id',
    primaryKey: true,
  },
  serviceId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'service_id',
    primaryKey: true,
  },
}, {
  tableName: 'staff_services',
  timestamps: false,
  underscored: true,
});

module.exports = StaffService;
