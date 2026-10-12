const { body } = require('express-validator');

const createReviewValidator = [
  body('appointmentId').isUUID().withMessage('Geçerli bir randevu ID giriniz'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Puan 1-5 arasında olmalıdır'),
  body('comment').optional().trim().isLength({ max: 1000 }),
  body('images').optional().isArray({ max: 4 }),
];

const replyValidator = [
  body('reply').trim().isLength({ min: 1, max: 500 }).withMessage('Yanıt 1-500 karakter olmalıdır'),
];

module.exports = { createReviewValidator, replyValidator };
