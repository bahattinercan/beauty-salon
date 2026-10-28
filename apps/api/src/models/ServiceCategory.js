const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ServiceCategory = sequelize.define('ServiceCategory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  iconName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'icon_name',
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'sort_order',
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'image_url',
  },
  videoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'video_url',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
}, {
  tableName: 'service_categories',
  timestamps: true,
  underscored: true,
  updatedAt: false,
});

module.exports = ServiceCategory;
