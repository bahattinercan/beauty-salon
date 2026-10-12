const router = require('express').Router();
const salonController = require('../controllers/salon.controller');
const staffController = require('../controllers/staff.controller');
const serviceController = require('../controllers/service.controller');
const productController = require('../controllers/product.controller');
const { authenticate, authorize, optionalAuth } = require('../middlewares/auth');
const { createSalonValidator, querySalonValidator, nearbyValidator } = require('../validators/salon.validator');
const validate = require('../middlewares/validate');

// Public salon endpoints
router.get('/', querySalonValidator, validate, salonController.getAll);
router.get('/nearby', nearbyValidator, validate, salonController.getNearby);
router.get('/owner/my-salons', authenticate, authorize('SALON_OWNER'), salonController.getMySalons);
router.get('/:id', salonController.getById);

// Salon CRUD (owner)
router.post('/', authenticate, authorize('SALON_OWNER'), createSalonValidator, validate, salonController.create);
router.patch('/:id', authenticate, authorize('SALON_OWNER', 'ADMIN'), salonController.update);
router.delete('/:id', authenticate, authorize('SALON_OWNER', 'ADMIN'), salonController.remove);

// Admin: salon onay
router.patch('/:id/verify', authenticate, authorize('ADMIN'), salonController.verify);

// E-posta değişikliği (OTP akışı)
router.post('/:id/request-email-change', authenticate, authorize('SALON_OWNER'), salonController.requestEmailChange);
router.post('/:id/confirm-email-change', authenticate, authorize('SALON_OWNER'), salonController.confirmEmailChange);

// Telefon değişikliği (OTP akışı)
router.post('/:id/request-phone-change', authenticate, authorize('SALON_OWNER'), salonController.requestPhoneChange);
router.post('/:id/confirm-phone-change', authenticate, authorize('SALON_OWNER'), salonController.confirmPhoneChange);

// Staff sub-routes
router.get('/:salonId/staff', staffController.getBySalon);
router.post('/:salonId/staff', authenticate, authorize('SALON_OWNER'), staffController.create);

// Service sub-routes
router.get('/:salonId/services', serviceController.getBySalon);
router.post('/:salonId/services', authenticate, authorize('SALON_OWNER'), serviceController.create);

// Product sub-routes (salon-scoped)
router.get('/:salonId/products', productController.getBySalon);
router.post('/:salonId/products', authenticate, authorize('SALON_OWNER'), productController.create);

module.exports = router;
