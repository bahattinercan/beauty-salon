const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'customer_id',
  },
  salonId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'salon_id',
  },
  staffId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'staff_id',
  },
  serviceId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'service_id',
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false,
    field: 'start_time',
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false,
    field: 'end_time',
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'),
    defaultValue: 'PENDING',
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  cancellationReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'cancellation_reason',
  },
}, {
  tableName: 'appointments',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['salon_id', 'date', 'status'] },
    { fields: ['staff_id', 'date'] },
    { fields: ['customer_id', 'status'] },
  ],
});

module.exports = Appointment;
