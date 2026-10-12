const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { successResponse, paginate, paginatedResponse } = require('../utils/helpers');
const { sendEmailChangeOtp } = require('../utils/mailer');

// GET /users/me
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'fullName', 'phone', 'avatarUrl', 'role', 'isVerified', 'createdAt'],
    });
    successResponse(res, user);
  } catch (error) {
    next(error);
  }
};

// PATCH /users/me
const updateProfile = async (req, res, next) => {
  try {
    const { fullName, phone, avatarUrl } = req.body;
    const updateData = {};

    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    await req.user.update(updateData);

    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'fullName', 'phone', 'avatarUrl', 'role'],
    });
    successResponse(res, user);
  } catch (error) {
    next(error);
  }
};

// GET /users (Admin)
const getAllUsers = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req.query.page, req.query.limit);

    const { count, rows } = await User.findAndCountAll({
      attributes: ['id', 'email', 'fullName', 'phone', 'role', 'isActive', 'isVerified', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    successResponse(res, paginatedResponse(rows, count, page, limit));
  } catch (error) {
    next(error);
  }
};

// PATCH /users/:id/toggle-active (Admin)
const toggleActive = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
    }

    await user.update({ isActive: !user.isActive });
    successResponse(res, { id: user.id, isActive: user.isActive });
  } catch (error) {
    next(error);
  }
};

// POST /users/me/request-email-change
// NOT: User modelinde pendingEmail/emailChangeToken alanları bulunmadığından
// passwordResetToken alanı repurpose edilmektedir.
// Token formatı: "EMAILCHANGE:<hashedOtp>:<base64(newEmail)>"
// Bu sayede confirmEmailChange yeni email'i token'dan parse edebilir.
const requestEmailChange = async (req, res, next) => {
  try {
    const { newEmail } = req.body;

    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return res.status(400).json({ success: false, message: 'Geçerli bir e-posta adresi girin' });
    }
    if (newEmail === req.user.email) {
      return res.status(400).json({ success: false, message: 'Yeni e-posta mevcut ile aynı' });
    }

    // Yeni e-postanın başka bir kullanıcıda kayıtlı olmadığını kontrol et
    const existing = await User.findOne({ where: { email: newEmail } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Bu e-posta adresi zaten kullanımda' });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 dakika

    // pendingEmail'i token'a encode et (User modeli ayrı alan desteklemiyor)
    const encodedEmail = Buffer.from(newEmail).toString('base64');
    const tokenValue = `EMAILCHANGE:${hashedOtp}:${encodedEmail}`;

    await req.user.update({
      passwordResetToken: tokenValue,
      passwordResetTokenExpiry: expiry,
    });

    await sendEmailChangeOtp(req.user.email, req.user.fullName, otp);

    successResponse(res, { message: 'Doğrulama kodu mevcut e-posta adresinize gönderildi' });
  } catch (error) {
    next(error);
  }
};

// POST /users/me/confirm-email-change
const confirmEmailChange = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Doğrulama kodu gerekli' });
    }

    const user = await User.findByPk(req.user.id);

    if (!user.passwordResetToken || !user.passwordResetToken.startsWith('EMAILCHANGE:')) {
      return res.status(400).json({ success: false, message: 'Aktif bir e-posta değişiklik isteği yok' });
    }

    if (new Date() > user.passwordResetTokenExpiry) {
      await user.update({ passwordResetToken: null, passwordResetTokenExpiry: null });
      return res.status(400).json({ success: false, message: 'Doğrulama kodunun süresi dolmuş' });
    }

    // Token formatı: "EMAILCHANGE:<hashedOtp>:<base64(newEmail)>"
    const parts = user.passwordResetToken.split(':');
    if (parts.length < 3) {
      return res.status(400).json({ success: false, message: 'Geçersiz token formatı' });
    }
    const storedHash = parts[1];
    const pendingEmail = Buffer.from(parts[2], 'base64').toString('utf8');

    const isValid = await bcrypt.compare(token, storedHash);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Doğrulama kodu hatalı' });
    }

    await user.update({
      email: pendingEmail,
      passwordResetToken: null,
      passwordResetTokenExpiry: null,
    });

    successResponse(res, { message: 'E-posta başarıyla güncellendi', email: pendingEmail });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, getAllUsers, toggleActive, requestEmailChange, confirmEmailChange };
