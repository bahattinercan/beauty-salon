const router = require('express').Router();
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middlewares/auth');

// API kök rotası
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Beauty Salon API',
    version: 'v1',
    endpoints: [
      '/api/v1/health',
      '/api/v1/auth',
      '/api/v1/salons',
      '/api/v1/services',
      '/api/v1/categories',
      '/api/v1/appointments',
      '/api/v1/reviews',
      '/api/v1/favorites',
      '/api/v1/notifications',
      '/api/v1/products',
      '/api/v1/settings',
    ],
  });
});

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/salons', require('./salon.routes'));
router.use('/staff', require('./staff.routes'));
router.use('/services', require('./service.routes'));
router.use('/categories', require('./category.routes'));
router.use('/appointments', require('./appointment.routes'));
router.use('/reviews', require('./review.routes'));
router.use('/favorites', require('./favorite.routes'));
router.use('/upload', require('./upload.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/products', require('./product.routes'));
router.use('/settings', require('./settings.routes'));

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Beauty Salon API is running', timestamp: new Date().toISOString() });
});

module.exports = router;
