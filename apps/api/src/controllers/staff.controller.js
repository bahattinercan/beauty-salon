const { Staff, Service, Salon, StaffService, ServiceCategory } = require('../models');
const { successResponse } = require('../utils/helpers');

// GET /salons/:salonId/staff
const getBySalon = async (req, res, next) => {
  try {
    const staff = await Staff.findAll({
      where: { salonId: req.params.salonId, isActive: true },
      include: [{
        model: Service, as: 'services',
        through: { attributes: [] },
        include: [{ model: ServiceCategory, as: 'category' }],
      }],
      order: [['fullName', 'ASC']],
    });
    successResponse(res, staff);
  } catch (error) {
    next(error);
  }
};

// POST /salons/:salonId/staff
const create = async (req, res, next) => {
  try {
    // Salon sahipliği kontrolü
    const salon = await Salon.findByPk(req.params.salonId);
    if (!salon || salon.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bu salon üzerinde yetkiniz yok' });
    }

    const { serviceIds, ...staffData } = req.body;
    const staff = await Staff.create({ ...staffData, salonId: req.params.salonId });

    if (serviceIds && serviceIds.length > 0) {
      const records = serviceIds.map(serviceId => ({ staffId: staff.id, serviceId }));
      await StaffService.bulkCreate(records);
    }

    const result = await Staff.findByPk(staff.id, {
      include: [{ model: Service, as: 'services', through: { attributes: [] } }],
    });
    successResponse(res, result, 201);
  } catch (error) {
    next(error);
  }
};

// PATCH /staff/:id
const update = async (req, res, next) => {
  try {
    const staff = await Staff.findByPk(req.params.id, { include: [{ model: Salon, as: 'salon' }] });
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Çalışan bulunamadı' });
    }
    if (staff.salon.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Yetkiniz yok' });
    }

    const { serviceIds, ...staffData } = req.body;
    await staff.update(staffData);

    if (serviceIds !== undefined) {
      await StaffService.destroy({ where: { staffId: staff.id } });
      if (serviceIds.length > 0) {
        const records = serviceIds.map(serviceId => ({ staffId: staff.id, serviceId }));
        await StaffService.bulkCreate(records);
      }
    }

    const result = await Staff.findByPk(staff.id, {
      include: [{ model: Service, as: 'services', through: { attributes: [] } }],
    });
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

// DELETE /staff/:id (soft delete)
const remove = async (req, res, next) => {
  try {
    const staff = await Staff.findByPk(req.params.id, { include: [{ model: Salon, as: 'salon' }] });
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Çalışan bulunamadı' });
    }
    if (staff.salon.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Yetkiniz yok' });
    }

    await staff.update({ isActive: false });
    successResponse(res, { message: 'Çalışan devre dışı bırakıldı' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getBySalon, create, update, remove };
