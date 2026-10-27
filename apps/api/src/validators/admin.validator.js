const { query } = require('express-validator');

const SALON_STATUS_VALUES = ['onaylı', 'bekliyor', 'pasif'];
const SALON_SORT_VALUES = ['createdAt', 'name', 'rating'];
const ORDER_VALUES = ['asc', 'desc'];

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

module.exports = { adminSalonQueryValidator };
