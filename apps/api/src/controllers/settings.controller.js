const { Setting } = require('../models');
const { successResponse } = require('../utils/helpers');

// Varsayılan ayarlar — DB'de yoksa bunlarla doldurulur
const DEFAULTS = {
  platformName: 'Beauty Salon',
  contactEmail: 'info@beautysalon.com',
  supportPhone: '',
  maxLoginAttempts: 5,
  tokenDuration: '30',
  rateLimitingEnabled: true,
  emailNotificationsEnabled: true,
  newSalonNotificationsEnabled: true,
  newReviewNotificationsEnabled: true,
  maintenanceModeEnabled: false,
  language: 'system',
};

// language için kabul edilen değerler
const ALLOWED_LANGUAGES = ['tr', 'en', 'system'];

// GET /settings (Admin)
const getSettings = async (req, res, next) => {
  try {
    const rows = await Setting.findAll();
    const settings = { ...DEFAULTS };
    for (const row of rows) settings[row.key] = row.value;
    successResponse(res, settings);
  } catch (error) {
    next(error);
  }
};

// PUT /settings (Admin) — { key: value, ... }
const updateSettings = async (req, res, next) => {
  try {
    const entries = Object.entries(req.body || {});

    // language zorunlu değil; gelirse yalnızca izinli değerlerden biri olmalı
    if (entries.some(([key]) => key === 'language')) {
      const { language } = req.body;
      if (!ALLOWED_LANGUAGES.includes(language)) {
        return res.status(400).json({
          success: false,
          message: "Geçersiz dil; 'tr', 'en' veya 'system' olmalı",
        });
      }
    }

    for (const [key, value] of entries) {
      await Setting.upsert({ key, value });
    }

    const rows = await Setting.findAll();
    const settings = { ...DEFAULTS };
    for (const row of rows) settings[row.key] = row.value;

    successResponse(res, settings);
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, updateSettings };
