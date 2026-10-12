const router = require('express').Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middlewares/auth');

// Tüm admin route'ları korumalı
router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', adminController.getDashboard);
router.get('/salons', adminController.getAllSalons);
router.get('/appointments', adminController.getAllAppointments);
router.get('/reviews', adminController.getAllReviews);

module.exports = router;
