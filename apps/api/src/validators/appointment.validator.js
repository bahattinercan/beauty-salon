const { body, query } = require('express-validator');

const createAppointmentValidator = [
  body('salonId').isUUID().withMessage('Geçerli bir salon ID giriniz'),
  // staffId opsiyonel: verilmezse salon, hizmeti sunan boş bir çalışanı atar
  body('staffId').optional().isUUID().withMessage('Geçerli bir çalışan ID giriniz'),
  body('serviceId').isUUID().withMessage('Geçerli bir hizmet ID giriniz'),
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Tarih YYYY-MM-DD formatında olmalıdır'),
  body('startTime').matches(/^\d{2}:\d{2}$/).withMessage('Saat HH:MM formatında olmalıdır'),
  body('note').optional().trim().isLength({ max: 500 }),
];

const availableSlotsValidator = [
  query('salonId').isUUID().withMessage('Geçerli bir salon ID giriniz'),
  query('staffId').optional().isUUID().withMessage('Geçerli bir çalışan ID giriniz'),
  query('serviceId').isUUID().withMessage('Geçerli bir hizmet ID giriniz'),
  query('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Tarih YYYY-MM-DD formatında olmalıdır'),
];

module.exports = { createAppointmentValidator, availableSlotsValidator };
