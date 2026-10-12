const router = require('express').Router();
const staffController = require('../controllers/staff.controller');
const { authenticate, authorize } = require('../middlewares/auth');

router.patch('/:id', authenticate, authorize('SALON_OWNER'), staffController.update);
router.delete('/:id', authenticate, authorize('SALON_OWNER'), staffController.remove);

module.exports = router;
