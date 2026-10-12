const router = require('express').Router();
const serviceController = require('../controllers/service.controller');
const { authenticate, authorize } = require('../middlewares/auth');

// Salon service endpoints
router.get('/salons/:salonId/services', serviceController.getBySalon);
router.post('/salons/:salonId/services', authenticate, authorize('SALON_OWNER'), serviceController.create);

// Service CRUD (individual endpoints)
router.get('/:id', serviceController.getById);
router.patch('/:id', authenticate, authorize('SALON_OWNER'), serviceController.update);
router.delete('/:id', authenticate, authorize('SALON_OWNER'), serviceController.remove);

module.exports = router;
