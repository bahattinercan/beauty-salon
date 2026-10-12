const { body, query } = require('express-validator');

const createProductValidator = [
  body('name').trim().isLength({ min: 1, max: 200 }).withMessage('Ürün adı 1-200 karakter olmalıdır'),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('price').isNumeric().withMessage('Fiyat sayısal olmalıdır'),
  body('price').isFloat({ min: 0 }).withMessage('Fiyat 0 veya更大 olmalıdır'),
  body('stockQuantity').optional().isInt({ min: 0 }).withMessage('Stok miktarı 0 veya更大 olmalıdır'),
  body('category').optional().trim().isLength({ max: 100 }),
  body('images').optional().isArray(),
];

const updateProductValidator = [
  body('name').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('price').optional().isNumeric().withMessage('Fiyat sayısal olmalıdır'),
  body('price').optional().isFloat({ min: 0 }),
  body('stockQuantity').optional().isInt({ min: 0 }),
  body('category').optional().trim().isLength({ max: 100 }),
  body('images').optional().isArray(),
];

const queryProductValidator = [
  query('search').optional().trim().isLength({ max: 100 }),
  query('category').optional().trim().isLength({ max: 100 }),
  query('sortBy').optional().isIn(['price', 'createdAt', 'name']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

module.exports = { createProductValidator, updateProductValidator, queryProductValidator };
