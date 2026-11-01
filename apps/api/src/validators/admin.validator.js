const { query, body } = require('express-validator');

const SALON_STATUS_VALUES = ['onaylı', 'bekliyor', 'pasif'];
const SALON_SORT_VALUES = ['createdAt', 'name', 'rating'];
const ORDER_VALUES = ['asc', 'desc'];

const APPOINTMENT_STATUS_VALUES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
const APPOINTMENT_SORT_VALUES = ['createdAt', 'date'];
const REVIEW_VISIBILITY_VALUES = ['all', 'visible', 'hidden'];
const REVIEW_REPLIED_VALUES = ['all', 'replied', 'unreplied'];
const REVIEW_SORT_VALUES = ['createdAt', 'rating'];
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const adminSalonQueryValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page 1 veya daha büyük bir tam sayı olmalıdır'),
  // limit üst sınırı bilinçli olarak yok: 100'ün üzeri hata değil, paginate() içinde kırpılır
  query('limit').optional().isInt({ min: 1 }).withMessage('limit 1 veya daha büyük bir tam sayı olmalıdır'),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('search en fazla 100 karakter olabilir'),
  query('status').optional().isIn(SALON_STATUS_VALUES)
    .withMessage(`status ${SALON_STATUS_VALUES.join(', ')} değerlerinden biri olmalıdır`),
  query('city').optional().trim().isLength({ max: 60 }).withMessage('city en fazla 60 karakter olabilir'),
  query('district').optional().trim().isLength({ max: 60 }).withMessage('district en fazla 60 karakter olabilir'),
  query('minRating').optional().isFloat({ min: 0, max: 5 }).withMessage('minRating 0-5 arasında olmalıdır'),
  query('sort').optional().isIn(SALON_SORT_VALUES)
    .withMessage(`sort ${SALON_SORT_VALUES.join(', ')} değerlerinden biri olmalıdır`),
  query('order').optional().isIn(ORDER_VALUES)
    .withMessage(`order ${ORDER_VALUES.join(', ')} değerlerinden biri olmalıdır`),
  query('verified').optional().isIn(['true', 'false']).withMessage('verified true veya false olmalıdır'),
];

const adminAppointmentQueryValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page 1 veya daha büyük bir tam sayı olmalıdır'),
  // limit üst sınırı bilinçli olarak yok: 100'ün üzeri hata değil, paginate() içinde kırpılır
  query('limit').optional().isInt({ min: 1 }).withMessage('limit 1 veya daha büyük bir tam sayı olmalıdır'),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('search en fazla 100 karakter olabilir'),
  query('status').optional().isIn(APPOINTMENT_STATUS_VALUES)
    .withMessage(`status ${APPOINTMENT_STATUS_VALUES.join(', ')} değerlerinden biri olmalıdır`),
  query('salonId').optional().isUUID().withMessage('salonId geçerli bir UUID olmalıdır'),
  query('staffId').optional().isUUID().withMessage('staffId geçerli bir UUID olmalıdır'),
  query('dateFrom').optional().matches(DATE_ONLY_PATTERN)
    .withMessage('dateFrom YYYY-MM-DD biçiminde olmalıdır'),
  query('dateTo').optional().matches(DATE_ONLY_PATTERN)
    .withMessage('dateTo YYYY-MM-DD biçiminde olmalıdır')
    .custom((value, { req }) => {
      const dateFrom = req.query.dateFrom;
      // DATEONLY string karşılaştırması: YYYY-MM-DD sözlük sırası kronolojik sıradır
      if (dateFrom && DATE_ONLY_PATTERN.test(dateFrom) && value < dateFrom) {
        throw new Error('dateTo, dateFrom değerinden önce olamaz');
      }
      return true;
    }),
  query('sort').optional().isIn(APPOINTMENT_SORT_VALUES)
    .withMessage(`sort ${APPOINTMENT_SORT_VALUES.join(', ')} değerlerinden biri olmalıdır`),
  query('order').optional().isIn(ORDER_VALUES)
    .withMessage(`order ${ORDER_VALUES.join(', ')} değerlerinden biri olmalıdır`),
];

const adminReviewQueryValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page 1 veya daha büyük bir tam sayı olmalıdır'),
  // limit üst sınırı bilinçli olarak yok: 100'ün üzeri hata değil, paginate() içinde kırpılır
  query('limit').optional().isInt({ min: 1 }).withMessage('limit 1 veya daha büyük bir tam sayı olmalıdır'),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('search en fazla 100 karakter olabilir'),
  query('rating').optional().isInt({ min: 1, max: 5 }).withMessage('rating 1-5 arasında bir tam sayı olmalıdır'),
  query('visibility').optional().isIn(REVIEW_VISIBILITY_VALUES)
    .withMessage(`visibility ${REVIEW_VISIBILITY_VALUES.join(', ')} değerlerinden biri olmalıdır`),
  query('replied').optional().isIn(REVIEW_REPLIED_VALUES)
    .withMessage(`replied ${REVIEW_REPLIED_VALUES.join(', ')} değerlerinden biri olmalıdır`),
  query('salonId').optional().isUUID().withMessage('salonId geçerli bir UUID olmalıdır'),
  query('dateFrom').optional().matches(DATE_ONLY_PATTERN)
    .withMessage('dateFrom YYYY-MM-DD biçiminde olmalıdır'),
  query('dateTo').optional().matches(DATE_ONLY_PATTERN)
    .withMessage('dateTo YYYY-MM-DD biçiminde olmalıdır')
    .custom((value, { req }) => {
      const dateFrom = req.query.dateFrom;
      // YYYY-MM-DD sözlük sırası kronolojik sıradır
      if (dateFrom && DATE_ONLY_PATTERN.test(dateFrom) && value < dateFrom) {
        throw new Error('dateTo, dateFrom değerinden önce olamaz');
      }
      return true;
    }),
  query('sort').optional().isIn(REVIEW_SORT_VALUES)
    .withMessage(`sort ${REVIEW_SORT_VALUES.join(', ')} değerlerinden biri olmalıdır`),
  query('order').optional().isIn(ORDER_VALUES)
    .withMessage(`order ${ORDER_VALUES.join(', ')} değerlerinden biri olmalıdır`),
];

// trim önce çalışır: yalnız boşluktan oluşan yanıt 1 karakter kuralına takılır
const adminReviewReplyValidator = [
  body('reply').trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('reply 1-2000 karakter arasında olmalıdır'),
];

module.exports = {
  adminSalonQueryValidator,
  adminAppointmentQueryValidator,
  adminReviewQueryValidator,
  adminReviewReplyValidator,
};
