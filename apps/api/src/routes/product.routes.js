const router = require('express').Router();
const productController = require('../controllers/product.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { updateProductValidator } = require('../validators/product.validator');
const validate = require('../middlewares/validate');

// Ürün güncelle (salon sahibi) — before /:id
router.patch('/:id', authenticate, authorize('SALON_OWNER'), updateProductValidator, validate, productController.update);

// Ürün sil / devre dışı bırak (salon sahibi) — before /:id
router.delete('/:id', authenticate, authorize('SALON_OWNER'), productController.remove);

// Tekil ürün getir (public)
router.get('/:id', productController.getById);

module.exports = router;
