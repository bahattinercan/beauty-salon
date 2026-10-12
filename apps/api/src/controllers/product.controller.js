const { Product, Salon } = require('../models');
const { Op } = require('sequelize');
const { successResponse } = require('../utils/helpers');

// GET /salons/:salonId/products
const getBySalon = async (req, res, next) => {
  try {
    const { salonId } = req.params;
    const { search, category, sortBy } = req.query;

    const where = { salonId: salonId, isActive: true };

    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }
    if (category) where.category = category;

    const products = await Product.findAll({
      where,
      order: sortBy === 'price' ? [['price', 'ASC']] : [['createdAt', 'DESC']],
    });

    successResponse(res, products);
  } catch (error) {
    next(error);
  }
};

// GET /products/:id
const getById = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Ürün bulunamadı' });
    successResponse(res, product);
  } catch (error) {
    next(error);
  }
};

// POST /salons/:salonId/products
const create = async (req, res, next) => {
  try {
    const salon = await Salon.findByPk(req.params.salonId);
    if (!salon || salon.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bu salon üzerinde yetkiniz yok' });
    }

    const product = await Product.create({ ...req.body, salonId: req.params.salonId });
    successResponse(res, product, 201);
  } catch (error) {
    next(error);
  }
};

// PATCH /products/:id
const update = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Ürün bulunamadı' });

    const salon = await Salon.findByPk(product.salonId);
    if (!salon || salon.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Yetkiniz yok' });
    }

    await product.update(req.body);
    successResponse(res, product);
  } catch (error) {
    next(error);
  }
};

// DELETE /products/:id (soft delete)
const remove = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Ürün bulunamadı' });

    const salon = await Salon.findByPk(product.salonId);
    if (!salon || salon.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Yetkiniz yok' });
    }

    await product.update({ isActive: false });
    successResponse(res, { message: 'Ürün devre dışı bırakıldı' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getBySalon, getById, create, update, remove };
