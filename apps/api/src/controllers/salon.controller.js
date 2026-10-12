const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { Salon, User, Staff, Service, ServiceCategory, Review } = require('../models');
const { successResponse, paginate, paginatedResponse, calculateDistance } = require('../utils/helpers');
const { sendEmailChangeOtp } = require('../utils/mailer');
const { sendSmsOtp } = require('../utils/sms');

// GET /salons
const getAll = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req.query.page, req.query.limit);
    const { search, city, district, categoryId, minRating, sortBy, priceRange, verified } = req.query;

    const where = { isActive: true, isVerified: true };
    if (priceRange) where.priceRange = parseInt(priceRange);
    if (verified === 'true') where.isVerified = true;

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } },
      ];
    }
    if (city) where.city = { [Op.like]: city };
    if (district) where.district = { [Op.like]: district };
    if (minRating) where.ratingAvg = { [Op.gte]: parseFloat(minRating) };

    const include = [];
    if (categoryId) {
      include.push({
        model: Service,
        as: 'services',
        where: { categoryId, isActive: true },
        attributes: [],
        required: true,
      });
    }

    let order = [['createdAt', 'DESC']];
    if (sortBy === 'rating') order = [['ratingAvg', 'DESC']];
    if (sortBy === 'newest') order = [['createdAt', 'DESC']];

    const { count, rows } = await Salon.findAndCountAll({
      where,
      include,
      order,
      limit,
      offset,
      distinct: true,
    });

    successResponse(res, paginatedResponse(rows, count, page, limit));
  } catch (error) {
    next(error);
  }
};

// GET /salons/nearby
const getNearby = async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;
    const { limit, offset, page } = paginate(req.query.page, req.query.limit);
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rad = parseFloat(radius);
    const degRadius = rad / 111.32;

    const salons = await Salon.findAll({
      where: {
        isActive: true,
        isVerified: true,
        latitude: { [Op.between]: [lat - degRadius, lat + degRadius] },
        longitude: { [Op.between]: [lng - degRadius, lng + degRadius] },
      },
    });

    // Gerçek mesafe hesapla ve filtrele
    const withDistance = salons
      .map(s => ({
        ...s.toJSON(),
        distance: calculateDistance(lat, lng, s.latitude, s.longitude),
      }))
      .filter(s => s.distance <= rad)
      .sort((a, b) => a.distance - b.distance);

    const paginated = withDistance.slice(offset, offset + limit);
    successResponse(res, paginatedResponse(paginated, withDistance.length, page, limit));
  } catch (error) {
    next(error);
  }
};

// GET /salons/:id
const getById = async (req, res, next) => {
  try {
    const salon = await Salon.findByPk(req.params.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'fullName', 'avatarUrl'] },
        {
          model: Staff, as: 'staff',
          where: { isActive: true },
          required: false,
          include: [{ model: Service, as: 'services', through: { attributes: [] } }],
        },
        {
          model: Service, as: 'services',
          where: { isActive: true },
          required: false,
          include: [{ model: ServiceCategory, as: 'category' }],
          order: [['category', 'sortOrder', 'ASC']],
        },
      ],
    });

    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon bulunamadı' });
    }

    successResponse(res, salon);
  } catch (error) {
    next(error);
  }
};

// POST /salons
const create = async (req, res, next) => {
  try {
    const salon = await Salon.create({
      ...req.body,
      ownerId: req.user.id,
    });
    successResponse(res, salon, 201);
  } catch (error) {
    next(error);
  }
};

// PATCH /salons/:id
const update = async (req, res, next) => {
  try {
    const salon = await Salon.findByPk(req.params.id);
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon bulunamadı' });
    }
    if (salon.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Bu salon üzerinde yetkiniz yok' });
    }

    // E-posta değişikliği doğrudan PATCH ile yapılamaz, ayrı OTP akışı gerekir
    const { email, pendingEmail, emailChangeToken, emailChangeTokenExpiry, ...safeBody } = req.body;
    await salon.update(safeBody);
    successResponse(res, salon);
  } catch (error) {
    next(error);
  }
};

// DELETE /salons/:id (soft delete)
const remove = async (req, res, next) => {
  try {
    const salon = await Salon.findByPk(req.params.id);
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon bulunamadı' });
    }
    if (salon.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Bu salon üzerinde yetkiniz yok' });
    }

    await salon.update({ isActive: false });
    successResponse(res, { message: 'Salon devre dışı bırakıldı' });
  } catch (error) {
    next(error);
  }
};

// PATCH /salons/:id/verify (Admin)
const verify = async (req, res, next) => {
  try {
    const salon = await Salon.findByPk(req.params.id);
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon bulunamadı' });
    }
    await salon.update({ isVerified: true });
    successResponse(res, { id: salon.id, isVerified: true });
  } catch (error) {
    next(error);
  }
};

// GET /salons/owner/my-salons
const getMySalons = async (req, res, next) => {
  try {
    const salons = await Salon.findAll({
      where: { ownerId: req.user.id, isActive: true },
    });
    successResponse(res, salons);
  } catch (error) {
    next(error);
  }
};

// POST /salons/:id/request-email-change
const requestEmailChange = async (req, res, next) => {
  try {
    const salon = await Salon.findByPk(req.params.id);
    if (!salon) return res.status(404).json({ success: false, message: 'Salon bulunamadı' });
    if (salon.ownerId !== req.user.id) return res.status(403).json({ success: false, message: 'Yetkiniz yok' });

    const { newEmail, verifyVia = 'email' } = req.body;
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return res.status(400).json({ success: false, message: 'Geçerli bir e-posta adresi girin' });
    }
    if (newEmail === salon.email) {
      return res.status(400).json({ success: false, message: 'Yeni e-posta mevcut ile aynı' });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await salon.update({ pendingEmail: newEmail, emailChangeToken: hashedOtp, emailChangeTokenExpiry: expiry });

    if (verifyVia === 'sms') {
      if (!salon.phone) return res.status(400).json({ success: false, message: 'Kayıtlı telefon numarası yok' });
      await sendSmsOtp(salon.phone, otp);
      successResponse(res, { message: `Doğrulama kodu ${salon.phone} numarasına SMS olarak gönderildi` });
    } else {
      await sendEmailChangeOtp(salon.email, salon.name, otp);
      successResponse(res, { message: 'Doğrulama kodu eski e-posta adresinize gönderildi' });
    }
  } catch (error) {
    next(error);
  }
};

// POST /salons/:id/confirm-email-change
const confirmEmailChange = async (req, res, next) => {
  try {
    const salon = await Salon.findByPk(req.params.id);
    if (!salon) return res.status(404).json({ success: false, message: 'Salon bulunamadı' });
    if (salon.ownerId !== req.user.id) return res.status(403).json({ success: false, message: 'Yetkiniz yok' });

    const { token } = req.body;
    if (!salon.emailChangeToken || !salon.pendingEmail) {
      return res.status(400).json({ success: false, message: 'Aktif bir e-posta değişiklik isteği yok' });
    }
    if (new Date() > salon.emailChangeTokenExpiry) {
      await salon.update({ emailChangeToken: null, pendingEmail: null, emailChangeTokenExpiry: null });
      return res.status(400).json({ success: false, message: 'Doğrulama kodunun süresi dolmuş' });
    }
    const isValidToken = await bcrypt.compare(token, salon.emailChangeToken);
    if (!isValidToken) {
      return res.status(400).json({ success: false, message: 'Doğrulama kodu hatalı' });
    }

    await salon.update({
      email: salon.pendingEmail,
      pendingEmail: null,
      emailChangeToken: null,
      emailChangeTokenExpiry: null,
    });

    successResponse(res, { message: 'E-posta başarıyla güncellendi', email: salon.email });
  } catch (error) {
    next(error);
  }
};

// POST /salons/:id/request-phone-change
const requestPhoneChange = async (req, res, next) => {
  try {
    const salon = await Salon.findByPk(req.params.id);
    if (!salon) return res.status(404).json({ success: false, message: 'Salon bulunamadı' });
    if (salon.ownerId !== req.user.id) return res.status(403).json({ success: false, message: 'Yetkiniz yok' });

    const { newPhone, verifyVia = 'sms' } = req.body;
    if (!newPhone) return res.status(400).json({ success: false, message: 'Yeni telefon numarası gerekli' });
    if (newPhone === salon.phone) return res.status(400).json({ success: false, message: 'Yeni numara mevcut ile aynı' });

    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await salon.update({ pendingPhone: newPhone, phoneChangeToken: hashedOtp, phoneChangeTokenExpiry: expiry });

    if (verifyVia === 'email') {
      if (!salon.email) return res.status(400).json({ success: false, message: 'Kayıtlı e-posta yok' });
      await sendEmailChangeOtp(salon.email, salon.name, otp);
      successResponse(res, { message: 'Doğrulama kodu e-posta adresinize gönderildi' });
    } else {
      await sendSmsOtp(salon.phone, otp);
      successResponse(res, { message: `Doğrulama kodu ${salon.phone} numarasına SMS olarak gönderildi` });
    }
  } catch (error) {
    next(error);
  }
};

// POST /salons/:id/confirm-phone-change
const confirmPhoneChange = async (req, res, next) => {
  try {
    const salon = await Salon.findByPk(req.params.id);
    if (!salon) return res.status(404).json({ success: false, message: 'Salon bulunamadı' });
    if (salon.ownerId !== req.user.id) return res.status(403).json({ success: false, message: 'Yetkiniz yok' });

    const { token } = req.body;
    if (!salon.phoneChangeToken || !salon.pendingPhone) {
      return res.status(400).json({ success: false, message: 'Aktif bir telefon değişiklik isteği yok' });
    }
    if (new Date() > salon.phoneChangeTokenExpiry) {
      await salon.update({ phoneChangeToken: null, pendingPhone: null, phoneChangeTokenExpiry: null });
      return res.status(400).json({ success: false, message: 'Doğrulama kodunun süresi dolmuş' });
    }
    const isValidToken = await bcrypt.compare(token, salon.phoneChangeToken);
    if (!isValidToken) {
      return res.status(400).json({ success: false, message: 'Doğrulama kodu hatalı' });
    }

    await salon.update({
      phone: salon.pendingPhone,
      pendingPhone: null,
      phoneChangeToken: null,
      phoneChangeTokenExpiry: null,
    });

    successResponse(res, { message: 'Telefon numarası başarıyla güncellendi', phone: salon.phone });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll, getNearby, getById, create, update, remove, verify, getMySalons,
  requestEmailChange, confirmEmailChange,
  requestPhoneChange, confirmPhoneChange,
};
