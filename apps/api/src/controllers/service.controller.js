const { Service, ServiceCategory, Salon, Staff } = require('../models');
const { successResponse } = require('../utils/helpers');

// GET /services/:id
const getById = async (req, res, next) => {
  try {
    const service = await Service.findByPk(req.params.id, {
      include: [{ model: ServiceCategory, as: 'category' }],
    });
    if (!service) return res.status(404).json({ success: false, message: 'Hizmet bulunamadı' });
    successResponse(res, service);
  } catch (error) {
    next(error);
  }
};

// GET /salons/:salonId/services
const getBySalon = async (req, res, next) => {
  try {
    const services = await Service.findAll({
      where: { salonId: req.params.salonId, isActive: true },
      include: [{ model: ServiceCategory, as: 'category' }],
      order: [[{ model: ServiceCategory, as: 'category' }, 'sortOrder', 'ASC'], ['name', 'ASC']],
    });
    successResponse(res, services);
  } catch (error) {
    next(error);
  }
};

// POST /salons/:salonId/services
const create = async (req, res, next) => {
  try {
    const salon = await Salon.findByPk(req.params.salonId);
    if (!salon || salon.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bu salon üzerinde yetkiniz yok' });
    }

    const service = await Service.create({ ...req.body, salonId: req.params.salonId });
    const result = await Service.findByPk(service.id, {
      include: [{ model: ServiceCategory, as: 'category' }],
    });
    successResponse(res, result, 201);
  } catch (error) {
    next(error);
  }
};

// PATCH /services/:id
const update = async (req, res, next) => {
  try {
    const service = await Service.findByPk(req.params.id, {
      include: [{ model: Salon, as: 'salon' }],
    });
    if (!service) return res.status(404).json({ success: false, message: 'Hizmet bulunamadı' });
    if (service.salon.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Yetkiniz yok' });
    }

    await service.update(req.body);
    const updated = await Service.findByPk(service.id, {
      include: [{ model: ServiceCategory, as: 'category' }],
    });
    successResponse(res, updated);
  } catch (error) {
    next(error);
  }
};

// DELETE /services/:id (soft delete)
const remove = async (req, res, next) => {
  try {
    const service = await Service.findByPk(req.params.id, {
      include: [{ model: Salon, as: 'salon' }],
    });
    if (!service) return res.status(404).json({ success: false, message: 'Hizmet bulunamadı' });
    if (service.salon.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Yetkiniz yok' });
    }

    await service.update({ isActive: false });
    successResponse(res, { message: 'Hizmet devre dışı bırakıldı' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getBySalon, getById, create, update, remove };
