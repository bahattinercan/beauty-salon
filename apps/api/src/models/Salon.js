const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Salon = sequelize.define('Salon', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'owner_id',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: { args: [2, 100], msg: 'Salon adı 2-100 karakter arasında olmalıdır' },
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: { isEmail: true },
  },
  logoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'logo_url',
  },
  coverImageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'cover_image_url',
  },
  galleryImages: {
    type: DataTypes.TEXT,
    defaultValue: '[]',
    field: 'gallery_images',
    get() { try { return JSON.parse(this.getDataValue('galleryImages') || '[]'); } catch { return []; } },
    set(val) { this.setDataValue('galleryImages', JSON.stringify(val)); },
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  district: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ratingAvg: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    field: 'rating_avg',
  },
  reviewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'review_count',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_verified',
  },
  priceRange: {
    type: DataTypes.INTEGER,
    defaultValue: 2,
    field: 'price_range',
    validate: { min: 1, max: 3 },
  },
  workingHours: {
    type: DataTypes.TEXT,
    defaultValue: '{}',
    field: 'working_hours',
    get() { try { return JSON.parse(this.getDataValue('workingHours') || '{}'); } catch { return {}; } },
    set(val) { this.setDataValue('workingHours', JSON.stringify(val)); },
  },
  pendingEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'pending_email',
  },
  pendingPhone: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'pending_phone',
  },
  phoneChangeToken: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'phone_change_token',
  },
  phoneChangeTokenExpiry: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'phone_change_token_expiry',
  },
  emailChangeToken: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'email_change_token',
  },
  emailChangeTokenExpiry: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'email_change_token_expiry',
  },
}, {
  tableName: 'salons',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['latitude', 'longitude'] },
    { fields: ['city', 'district'] },
    { fields: ['is_active', 'is_verified'] },
  ],
});

module.exports = Salon;
