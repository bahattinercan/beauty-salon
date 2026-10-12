const router = require('express').Router();
const reviewController = require('../controllers/review.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { createReviewValidator, replyValidator } = require('../validators/review.validator');
const validate = require('../middlewares/validate');

router.post('/', authenticate, createReviewValidator, validate, reviewController.create);
router.get('/my', authenticate, reviewController.getMyReviews);
router.get('/salon/:salonId', reviewController.getBySalon);
router.patch('/:id/reply', authenticate, authorize('SALON_OWNER'), replyValidator, validate, reviewController.reply);
router.patch('/:id/toggle-visibility', authenticate, authorize('ADMIN'), reviewController.toggleVisibility);

module.exports = router;
