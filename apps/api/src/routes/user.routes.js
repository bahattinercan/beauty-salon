const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.get('/me', authenticate, userController.getProfile);
router.patch('/me', authenticate, userController.updateProfile);
router.post('/me/request-email-change', authenticate, userController.requestEmailChange);
router.post('/me/confirm-email-change', authenticate, userController.confirmEmailChange);
router.get('/', authenticate, authorize('ADMIN'), userController.getAllUsers);
router.patch('/:id/toggle-active', authenticate, authorize('ADMIN'), userController.toggleActive);

module.exports = router;
