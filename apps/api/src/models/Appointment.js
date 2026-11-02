const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Postgres `time` kolonu '10:00:00' döner, SQLite '10:00' döndürüyordu. API sözleşmesi HH:mm
// (validator ve Flutter tarafı bu formatı bekliyor); DB'de saklanan değer bozulmadan yalnız
// okunan değer normalize edilir.
const toHHmm = (value) => {
  if (typeof value !== 'string') return value;
  const match = value.match(/^(\d{2}:\d{2})/);
  return match ? match[1] : value;
};

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
    get() { return toHHmm(this.getDataValue('startTime')); },
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false,
    field: 'end_time',
    get() { return toHHmm(this.getDataValue('endTime')); },
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
