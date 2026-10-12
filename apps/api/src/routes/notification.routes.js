const router = require('express').Router();
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middlewares/auth');

// Tüm route'lar authenticate gerektirir (kullanıcıya özel)
router.use(authenticate);

// GET /notifications - Kullanıcının bildirimleri (sayfalı, filtreli)
router.get('/', notificationController.getMy);

// GET /notifications/unread-count - Okunmamış bildirim sayısı
router.get('/unread-count', notificationController.getUnreadCount);

// PATCH /notifications/:id/read - Tekil bildirimi okundu işaretle
router.patch('/:id/read', notificationController.markAsRead);

// PATCH /notifications/read-all - Tüm bildirimleri okundu işaretle
router.patch('/read-all', notificationController.markAllAsRead);

// DELETE /notifications/:id - Bildirimi sil
router.delete('/:id', notificationController.remove);

module.exports = router;
