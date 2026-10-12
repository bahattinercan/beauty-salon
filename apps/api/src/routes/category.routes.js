const router = require('express').Router();
const categoryController = require('../controllers/category.controller');
const { authenticate, authorize } = require('../middlewares/auth');

// GET /categories — Tüm kategorileri getir (public)
router.get('/', categoryController.getCategories);

// POST /categories — Yeni kategori oluştur (Admin)
router.post('/', authenticate, authorize('ADMIN'), categoryController.createCategory);

// PATCH /categories/:id — Kategori güncelle (Admin)
router.patch('/:id', authenticate, authorize('ADMIN'), categoryController.updateCategory);

// DELETE /categories/:id — Kategori sil (Admin)
router.delete('/:id', authenticate, authorize('ADMIN'), categoryController.deleteCategory);

module.exports = router;
