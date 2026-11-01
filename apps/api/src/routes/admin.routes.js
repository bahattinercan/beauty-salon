const router = require('express').Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const {
  adminSalonQueryValidator,
  adminAppointmentQueryValidator,
  adminReviewQueryValidator,
  adminReviewReplyValidator,
} = require('../validators/admin.validator');
const validate = require('../middlewares/validate');

// Tüm admin route'ları korumalı
router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', adminController.getDashboard);
router.get('/salons', adminSalonQueryValidator, validate, adminController.getAllSalons);
router.get('/appointments', adminAppointmentQueryValidator, validate, adminController.getAllAppointments);
router.get('/reviews', adminReviewQueryValidator, validate, adminController.getAllReviews);
router.patch('/reviews/:id/reply', adminReviewReplyValidator, validate, adminController.replyToReview);
router.delete('/reviews/:id', adminController.deleteReview);

module.exports = router;
