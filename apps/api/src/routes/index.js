const router = require('express').Router();
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middlewares/auth');
const { ROUTES } = require('./route-table');

// Mount edilen router'ların prefixleri tek kaynaktan (route-table) gelir;
// `GET /` keşif listesi de aynı tablodan üretilir (#31).
const apiPrefix = process.env.API_PREFIX || '/api/v1';

// API kök rotası
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Beauty Salon API',
    version: 'v1',
    endpoints: [
      `${apiPrefix}/health`,
      ...ROUTES.map((route) => `${apiPrefix}${route.prefix}`),
    ],
  });
});

ROUTES.forEach((route) => {
  router.use(route.prefix, route.router);
});

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Beauty Salon API is running', timestamp: new Date().toISOString() });
});

module.exports = router;
