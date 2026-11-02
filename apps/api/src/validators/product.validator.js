const { body } = require('express-validator');

// Yalnız PATCH /products/:id kullanır. Bağlı olmayan create/query validator'ları
// kaldırıldı (bkz. docs/api/11-known-issues.md #23).
const updateProductValidator = [
  body('name').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('price').optional().isNumeric().withMessage('Fiyat sayısal olmalıdır'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Fiyat 0 veya daha büyük olmalıdır'),
  body('stockQuantity').optional().isInt({ min: 0 }).withMessage('Stok miktarı 0 veya daha büyük olmalıdır'),
  body('category').optional().trim().isLength({ max: 100 }),
  body('images').optional().isArray(),
];

module.exports = { updateProductValidator };
