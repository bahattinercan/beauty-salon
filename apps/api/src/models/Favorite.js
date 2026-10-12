const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Favorite = sequelize.define('Favorite', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
  },
  salonId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'salon_id',
  },
}, {
  tableName: 'favorites',
  timestamps: true,
  underscored: true,
  updatedAt: false,
  // Bir kullanıcı bir salonu yalnızca bir kez favorileyebilir.
  indexes: [{ unique: true, fields: ['user_id', 'salon_id'] }],
});

module.exports = Favorite;
