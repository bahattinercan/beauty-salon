const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { successResponse } = require('../utils/helpers');
const crypto = require('crypto');
const { sendPasswordChangedEmail, sendPasswordResetOtp } = require('../utils/mailer');

// Token üretme
const generateTokens = (user) => {
  const payload = { sub: user.id, email: user.email, role: user.role };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION || '15m',
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  });

  return { accessToken, refreshToken };
};

// POST /auth/register
const register = async (req, res, next) => {
  try {
    const { email, password, fullName, phone, role } = req.body;

    // Email kontrolü
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Bu email adresi zaten kayıtlı' });
    }

    // Telefon kontrolü
    if (phone) {
      const existingPhone = await User.findOne({ where: { phone } });
      if (existingPhone) {
        return res.status(409).json({ success: false, message: 'Bu telefon numarası zaten kayıtlı' });
      }
    }

    // Kullanıcı oluştur (password hash model hook'unda yapılıyor)
    const user = await User.create({
      email,
      passwordHash: password,
      fullName,
      phone: phone || null,
      role: role || 'CUSTOMER',
    });

    const tokens = generateTokens(user);

    // Refresh token'ı hashle ve kaydet
    const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 12);
    await user.update({ refreshToken: hashedRefresh });

    successResponse(res, {
      user: user.toSafeJSON(),
      ...tokens,
    }, 201);
  } catch (error) {
    next(error);
  }
};

// POST /auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email veya şifre hatalı' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Hesabınız devre dışı bırakılmış' });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Email veya şifre hatalı' });
    }

    const tokens = generateTokens(user);

    const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 12);
    await user.update({ refreshToken: hashedRefresh });

    successResponse(res, {
      user: user.toSafeJSON(),
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
};

// POST /auth/refresh
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token gerekli' });
    }

    // Token'ı doğrula
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Geçersiz refresh token' });
    }

    const user = await User.findByPk(decoded.sub);
    if (!user || !user.refreshToken) {
      return res.status(401).json({ success: false, message: 'Erişim reddedildi' });
    }

    // Kayıtlı hash ile karşılaştır
    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Geçersiz refresh token' });
    }

    const tokens = generateTokens(user);
    const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 12);
    await user.update({ refreshToken: hashedRefresh });

    successResponse(res, tokens);
  } catch (error) {
    next(error);
  }
};

// POST /auth/logout
const logout = async (req, res, next) => {
  try {
    await req.user.update({ refreshToken: null });
    successResponse(res, { message: 'Başarıyla çıkış yapıldı' });
  } catch (error) {
    next(error);
  }
};

// POST /auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Mevcut şifre ve yeni şifre gerekli' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Yeni şifre en az 6 karakter olmalı' });
    }

    // authenticate middleware passwordHash'ı taşımıyor; güncel kullanıcıyı çek
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
    }

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Mevcut şifre hatalı' });
    }

    // passwordHash alanına atama yapınca model hook hash'ler
    await user.update({ passwordHash: newPassword });

    // Onay e-postası gönder
    await sendPasswordChangedEmail(user.email, user.fullName);

    successResponse(res, { message: 'Şifre başarıyla değiştirildi' });
  } catch (error) {
    next(error);
  }
};

// POST /auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'E-posta adresi gerekli' });
    }

    const user = await User.findOne({ where: { email } });
    // Kullanıcı bulunsun ya da bulunmasın aynı yanıtı ver (güvenlik)
    if (!user) {
      return successResponse(res, { message: 'Eğer bu e-posta kayıtlıysa, kod gönderildi' });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 dakika

    await user.update({ passwordResetToken: hashedOtp, passwordResetTokenExpiry: expiry });
    await sendPasswordResetOtp(user.email, user.fullName, otp);

    successResponse(res, { message: 'Şifre sıfırlama kodu e-posta adresinize gönderildi' });
  } catch (error) {
    next(error);
  }
};

// POST /auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ success: false, message: 'E-posta, kod ve yeni şifre gerekli' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Şifre en az 6 karakter olmalı' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !user.passwordResetToken) {
      return res.status(400).json({ success: false, message: 'Geçersiz veya süresi dolmuş kod' });
    }
    if (new Date() > user.passwordResetTokenExpiry) {
      await user.update({ passwordResetToken: null, passwordResetTokenExpiry: null });
      return res.status(400).json({ success: false, message: 'Kodun süresi dolmuş' });
    }
    const isValid = await bcrypt.compare(token, user.passwordResetToken);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Hatalı kod' });
    }

    await user.update({ passwordHash: newPassword, passwordResetToken: null, passwordResetTokenExpiry: null });

    successResponse(res, { message: 'Şifre başarıyla sıfırlandı' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refresh, logout, changePassword, forgotPassword, resetPassword };
