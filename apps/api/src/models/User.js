const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: 'Geçerli bir email adresi giriniz' },
    },
  },
  phone: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'full_name',
    validate: {
      len: { args: [2, 100], msg: 'İsim 2-100 karakter arasında olmalıdır' },
    },
  },
  avatarUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'avatar_url',
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'password_hash',
  },
  role: {
    type: DataTypes.ENUM('CUSTOMER', 'SALON_OWNER', 'ADMIN'),
    defaultValue: 'CUSTOMER',
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_verified',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'refresh_token',
  },
  passwordResetToken: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'password_reset_token',
  },
  passwordResetTokenExpiry: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'password_reset_token_expiry',
  },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
});

// Password hash hook
User.beforeCreate(async (user) => {
  if (user.passwordHash) {
    user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
  }
});

// Güncellemede de hash'le: controller düz metin şifre geçirebiliyor,
// hook olmadan plaintext olarak kaydedilirdi.
User.beforeUpdate(async (user) => {
  const changed = user.changed() || [];
  if (!changed.includes('passwordHash')) return;
  const value = user.getDataValue('passwordHash');
  if (value && !String(value).startsWith('$2')) {
    user.passwordHash = await bcrypt.hash(value, 12);
  }
});

// Instance method: şifre karşılaştırma
User.prototype.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

// Instance method: hassas verileri çıkart
User.prototype.toSafeJSON = function () {
  const values = this.toJSON();
  delete values.passwordHash;
  delete values.refreshToken;
  // Şifre sıfırlama akışının token alanları da yanıta sızmamalı (DB'de kalır)
  delete values.passwordResetToken;
  delete values.passwordResetTokenExpiry;
  return values;
};

module.exports = User;
