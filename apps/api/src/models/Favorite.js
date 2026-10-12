const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Favorite = sequelize.define('Favorite', {
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    field: 'user_id',
  },
  salonId: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    field: 'salon_id',
  },
}, {
  tableName: 'favorites',
  timestamps: true,
  underscored: true,
  updatedAt: false,
});

module.exports = Favorite;
