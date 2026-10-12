const { Op } = require('sequelize');
const { Appointment, Service, Staff, Salon, StaffService, User } = require('../models');
const { successResponse } = require('../utils/helpers');

// POST /appointments
const create = async (req, res, next) => {
  try {
    const { salonId, staffId, serviceId, date, startTime, note } = req.body;

    // 1. Hizmet kontrolü
    const service = await Service.findByPk(serviceId);
    if (!service || !service.isActive) {
      return res.status(404).json({ success: false, message: 'Hizmet bulunamadı' });
    }

    // 2. Çalışanın bu hizmeti sunup sunmadığı
    const staffService = await StaffService.findOne({
      where: { staffId, serviceId },
    });
    if (!staffService) {
      return res.status(400).json({ success: false, message: 'Bu çalışan seçilen hizmeti sunmuyor' });
    }

    // 3. Geçmiş tarih kontrolü
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(date) < today) {
      return res.status(400).json({ success: false, message: 'Geçmiş bir tarihe randevu alınamaz' });
    }

    // 4. End time hesapla
    const [startH, startM] = startTime.split(':').map(Number);
    const totalMinutes = startH * 60 + startM + service.durationMinutes;
    const endH = Math.floor(totalMinutes / 60);
    const endM = totalMinutes % 60;
    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    // 5. Salon çalışma saatleri kontrolü
    const salon = await Salon.findByPk(salonId);
    if (!salon || !salon.isActive || !salon.isVerified) {
      return res.status(404).json({ success: false, message: 'Salon bulunamadı veya aktif değil' });
    }

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = dayNames[new Date(date).getDay()];
    const daySchedule = salon.workingHours?.[dayOfWeek];

    if (daySchedule && daySchedule.open && daySchedule.close) {
      const [openH, openM] = daySchedule.open.split(':').map(Number);
      const [closeH, closeM] = daySchedule.close.split(':').map(Number);
      const openMin = openH * 60 + openM;
      const closeMin = closeH * 60 + closeM;
      const startMin = startH * 60 + startM;

      if (startMin < openMin || totalMinutes > closeMin) {
        return res.status(400).json({ success: false, message: 'Seçilen saat, salonun çalışma saatleri dışında' });
      }
    }

    // 6. Çakışma kontrolü
    const conflicting = await Appointment.findOne({
      where: {
        staffId,
        date,
        status: { [Op.in]: ['PENDING', 'CONFIRMED'] },
        [Op.or]: [
          { startTime: { [Op.lt]: endTime }, endTime: { [Op.gt]: startTime } },
        ],
      },
    });

    if (conflicting) {
      return res.status(409).json({ success: false, message: 'Seçilen saatte çalışanın başka bir randevusu var (saat çakışması)' });
    }

    // 7. Randevu oluştur
    const appointment = await Appointment.create({
      customerId: req.user.id,
      salonId,
      staffId,
      serviceId,
      date,
      startTime,
      endTime,
      note,
    });

    const result = await Appointment.findByPk(appointment.id, {
      include: [
        { model: Salon, as: 'salon', attributes: ['id', 'name', 'phone'] },
        { model: Staff, as: 'staff', attributes: ['id', 'fullName'] },
        { model: Service, as: 'service', attributes: ['id', 'name', 'price', 'durationMinutes'] },
      ],
    });

    successResponse(res, result, 201);
  } catch (error) {
    next(error);
  }
};

// GET /appointments/available-slots
const getAvailableSlots = async (req, res, next) => {
  try {
    const { salonId, staffId, serviceId, date } = req.query;

    const service = await Service.findByPk(serviceId);
    if (!service) return res.status(404).json({ success: false, message: 'Hizmet bulunamadı' });

    const salon = await Salon.findByPk(salonId);
    if (!salon) return res.status(404).json({ success: false, message: 'Salon bulunamadı' });

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = dayNames[new Date(date).getDay()];
    const daySchedule = salon.workingHours?.[dayOfWeek];

    if (!daySchedule || !daySchedule.open) {
      return successResponse(res, []);
    }

    const [openH, openM] = daySchedule.open.split(':').map(Number);
    const [closeH, closeM] = daySchedule.close.split(':').map(Number);
    const openMin = openH * 60 + openM;
    const closeMin = closeH * 60 + closeM;

    // Mevcut randevular
    const existing = await Appointment.findAll({
      where: {
        staffId,
        date,
        status: { [Op.in]: ['PENDING', 'CONFIRMED'] },
      },
      order: [['startTime', 'ASC']],
    });

    // Slot üret
    const slots = [];
    const interval = 30;

    for (let min = openMin; min + service.durationMinutes <= closeMin; min += interval) {
      const h = Math.floor(min / 60);
      const m = min % 60;
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const slotEnd = min + service.durationMinutes;

      const isConflicting = existing.some(apt => {
        const [ah, am] = apt.startTime.split(':').map(Number);
        const [eh, em] = apt.endTime.split(':').map(Number);
        const aptStart = ah * 60 + am;
        const aptEnd = eh * 60 + em;
        return min < aptEnd && slotEnd > aptStart;
      });

      slots.push({ time: timeStr, available: !isConflicting });
    }

    successResponse(res, slots);
  } catch (error) {
    next(error);
  }
};

// GET /appointments/my
const getMyAppointments = async (req, res, next) => {
  try {
    const where = { customerId: req.user.id };
    if (req.query.status) where.status = req.query.status;

    const appointments = await Appointment.findAll({
      where,
      include: [
        { model: Salon, as: 'salon', attributes: ['id', 'name', 'logoUrl', 'address', 'phone'] },
        { model: Staff, as: 'staff', attributes: ['id', 'fullName', 'avatarUrl'] },
        { model: Service, as: 'service', attributes: ['id', 'name', 'price', 'durationMinutes'] },
      ],
      order: [['date', 'DESC'], ['startTime', 'DESC']],
    });

    successResponse(res, appointments);
  } catch (error) {
    next(error);
  }
};

// GET /appointments/salon/:salonId
const getSalonAppointments = async (req, res, next) => {
  try {
    const where = { salonId: req.params.salonId };
    if (req.query.date) where.date = req.query.date;
    if (req.query.status) where.status = req.query.status;

    const appointments = await Appointment.findAll({
      where,
      include: [
        { model: User, as: 'customer', attributes: ['id', 'fullName', 'phone', 'avatarUrl'] },
        { model: Staff, as: 'staff', attributes: ['id', 'fullName'] },
        { model: Service, as: 'service', attributes: ['id', 'name', 'price', 'durationMinutes'] },
      ],
      order: [['date', 'ASC'], ['startTime', 'ASC']],
    });

    successResponse(res, appointments);
  } catch (error) {
    next(error);
  }
};

// PATCH /appointments/:id/status (Salon owner)
const updateStatus = async (req, res, next) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [{ model: Salon, as: 'salon', attributes: ['ownerId'] }],
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Randevu bulunamadı' });
    }

    if (req.user.role === 'SALON_OWNER' && appointment.salon.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bu randevu üzerinde yetkiniz yok' });
    }

    // Terminal durum kontrolü — bu statülerden geçiş yapılamaz
    if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appointment.status)) {
      return res.status(400).json({ success: false, message: 'Bu randevu üzerinde işlem yapılamaz' });
    }

    const validTransitions = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
    };

    const allowed = validTransitions[appointment.status] || [];
    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({
        success: false,
        message: `${appointment.status} durumundan ${req.body.status} durumuna geçilemez`,
      });
    }

    if (req.body.status === 'COMPLETED') {
      const appointmentEnd = new Date(`${appointment.date}T${appointment.endTime}`);
      if (appointmentEnd > new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Randevu saati henüz geçmedi, tamamlanamaz',
        });
      }
    }

    await appointment.update({ status: req.body.status });
    successResponse(res, appointment);
  } catch (error) {
    next(error);
  }
};

// PATCH /appointments/:id/cancel (Müşteri)
const cancel = async (req, res, next) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Randevu bulunamadı' });
    }
    if (appointment.customerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bu randevu size ait değil' });
    }
    if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) {
      return res.status(400).json({ success: false, message: 'Bu randevu iptal edilemez' });
    }

    await appointment.update({
      status: 'CANCELLED',
      cancellationReason: req.body.reason || null,
    });

    successResponse(res, appointment);
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAvailableSlots, getMyAppointments, getSalonAppointments, updateStatus, cancel };
