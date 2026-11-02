const router = require('express').Router();
const appointmentController = require('../controllers/appointment.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { createAppointmentValidator, availableSlotsValidator } = require('../validators/appointment.validator');
const { uuidParam } = require('../validators/uuid.validator');
const validate = require('../middlewares/validate');

// Geçersiz UUID -> 404 (Postgres uuid kolonunda 500'e düşmesin)
router.param('salonId', uuidParam('Salon bulunamadı'));
router.param('id', uuidParam('Randevu bulunamadı'));

router.post('/', authenticate, createAppointmentValidator, validate, appointmentController.create);
router.get('/my', authenticate, appointmentController.getMyAppointments);
router.get('/available-slots', availableSlotsValidator, validate, appointmentController.getAvailableSlots);
router.get('/salon/:salonId', authenticate, authorize('SALON_OWNER', 'ADMIN'), appointmentController.getSalonAppointments);
router.patch('/:id/status', authenticate, authorize('SALON_OWNER', 'ADMIN'), appointmentController.updateStatus);
router.patch('/:id/cancel', authenticate, appointmentController.cancel);

module.exports = router;
