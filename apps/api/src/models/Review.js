const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Review = sequelize.define('Review', {
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
  appointmentId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    field: 'appointment_id',
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 },
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  images: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  salonReply: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'salon_reply',
  },
  salonReplyAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'salon_reply_at',
  },
  isVisible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_visible',
  },
}, {
  tableName: 'reviews',
  timestamps: true,
  underscored: true,
});

module.exports = Review;
