const router = require('express').Router();
const appointmentController = require('../controllers/appointment.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { createAppointmentValidator, availableSlotsValidator } = require('../validators/appointment.validator');
const validate = require('../middlewares/validate');

router.post('/', authenticate, createAppointmentValidator, validate, appointmentController.create);
router.get('/my', authenticate, appointmentController.getMyAppointments);
router.get('/available-slots', availableSlotsValidator, validate, appointmentController.getAvailableSlots);
router.get('/salon/:salonId', authenticate, authorize('SALON_OWNER', 'ADMIN'), appointmentController.getSalonAppointments);
router.patch('/:id/status', authenticate, authorize('SALON_OWNER', 'ADMIN'), appointmentController.updateStatus);
router.patch('/:id/cancel', authenticate, appointmentController.cancel);

module.exports = router;
