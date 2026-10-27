const { body, query } = require('express-validator');

const WORKING_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const createSalonValidator = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Salon adı 2-100 karakter olmalıdır'),
  body('phone').matches(/^\+?[1-9]\d{9,14}$/).withMessage('Geçerli bir telefon numarası giriniz'),
  body('email').optional().isEmail().withMessage('Geçerli bir email giriniz'),
  body('address').trim().isLength({ min: 5 }).withMessage('Adres en az 5 karakter olmalıdır'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Geçerli bir enlem giriniz'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Geçerli bir boylam giriniz'),
  body('city').trim().notEmpty().withMessage('Şehir boş olamaz'),
  body('district').trim().notEmpty().withMessage('İlçe boş olamaz'),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('workingHours').optional().isObject(),
];

const querySalonValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim().isLength({ max: 100 }),
  query('city').optional().trim(),
  query('district').optional().trim(),
  query('minRating').optional().isFloat({ min: 0, max: 5 }),
];

const nearbyValidator = [
  query('latitude').isFloat({ min: -90, max: 90 }).withMessage('Geçerli bir enlem giriniz'),
  query('longitude').isFloat({ min: -180, max: 180 }).withMessage('Geçerli bir boylam giriniz'),
  query('radius').optional().isFloat({ min: 0.1, max: 100 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

// workingHours: 7 günden az olabilir (kapalı gün yazılmaz), ama yazılan her gün geçerli olmalı
const validateWorkingHours = (value) => {
  if (value === null) return true;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('workingHours nesne olmalıdır');
  }
  Object.entries(value).forEach(([day, hours]) => {
    if (!WORKING_DAYS.includes(day)) {
      throw new Error(`workingHours içinde geçersiz gün: ${day}`);
    }
    if (!hours || typeof hours !== 'object') {
      throw new Error(`workingHours.${day} açılış/kapanış saatleri içermelidir`);
    }
    const { open, close } = hours;
    if (!TIME_PATTERN.test(open || '') || !TIME_PATTERN.test(close || '')) {
      throw new Error(`workingHours.${day} saatleri HH:MM biçiminde olmalıdır`);
    }
    if (open >= close) {
      throw new Error(`workingHours.${day} açılış saati kapanıştan önce olmalıdır`);
    }
  });
  return true;
};

// PATCH /salons/:id — whitelist DEĞİL: yalnız tip/uzunluk doğrulanır, gövde olduğu gibi geçer.
const updateSalonValidator = [
  body('name').optional().trim().isLength({ min: 2, max: 100 })
    .withMessage('Salon adı 2-100 karakter olmalıdır'),
  body('phone').optional().matches(/^\+?[1-9]\d{9,14}$/)
    .withMessage('Geçerli bir telefon numarası giriniz'),
  body('address').optional().trim().isLength({ min: 5 })
    .withMessage('Adres en az 5 karakter olmalıdır'),
  body('city').optional().trim().notEmpty().withMessage('Şehir boş olamaz'),
  body('district').optional().trim().notEmpty().withMessage('İlçe boş olamaz'),
  body('description').optional({ values: 'null' }).trim().isLength({ max: 1000 })
    .withMessage('Açıklama en fazla 1000 karakter olabilir'),
  body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Geçerli bir enlem giriniz'),
  body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Geçerli bir boylam giriniz'),
  body('workingHours').optional({ values: 'null' }).custom(validateWorkingHours),
  body('logoUrl').optional({ values: 'null' }).isString().isLength({ max: 500 })
    .withMessage('logoUrl metin olmalıdır'),
  body('coverImageUrl').optional({ values: 'null' }).isString().isLength({ max: 500 })
    .withMessage('coverImageUrl metin olmalıdır'),
  body('galleryImages').optional({ values: 'null' }).isArray({ max: 12 })
    .withMessage('galleryImages en fazla 12 görsel içerebilir'),
  body('galleryImages.*').optional().isString().withMessage('Galeri görselleri metin olmalıdır'),
  body('isActive').optional().isBoolean().withMessage('isActive true veya false olmalıdır'),
];

module.exports = {
  createSalonValidator,
  querySalonValidator,
  nearbyValidator,
  updateSalonValidator,
};
