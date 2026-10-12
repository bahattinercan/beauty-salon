const { body, query } = require('express-validator');

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

module.exports = { createSalonValidator, querySalonValidator, nearbyValidator };
