const { Op } = require('sequelize');
const { ServiceCategory } = require('../models');
const { successResponse } = require('../utils/helpers');

// GET /categories — Tüm kategorileri getir (sıralı)
const getCategories = async (req, res, next) => {
  try {
    const categories = await ServiceCategory.findAll({
      order: [['sortOrder', 'ASC']],
    });
    successResponse(res, categories);
  } catch (error) {
    next(error);
  }
};

// POST /categories — Yeni kategori oluştur (Admin)
const createCategory = async (req, res, next) => {
  const { name, iconName, sortOrder } = req.body;

  if (!name || !iconName) {
    return res.status(400).json({
      success: false,
      message: 'name ve iconName alanları zorunludur',
    });
  }

  try {
    const category = await ServiceCategory.create({
      name,
      iconName,
      sortOrder: sortOrder || 0,
    });
    successResponse(res, category, 201);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: `'${name}' kategorisi zaten mevcut`,
      });
    }
    next(error);
  }
};

// PATCH /categories/:id — Kategori güncelle (Admin)
const updateCategory = async (req, res, next) => {
  const { name, iconName, sortOrder } = req.body;

  const category = await ServiceCategory.findByPk(req.params.id);
  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Kategori bulunamadı',
    });
  }

  try {
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (iconName !== undefined) updateData.iconName = iconName;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    if (Object.keys(updateData).length > 0) {
      // Unique name kontrolü (kendisinden farklı kategoriler arasında)
      if (updateData.name) {
        const existing = await ServiceCategory.findOne({
          where: { name: updateData.name, id: { [Op.ne]: category.id } },
        });
        if (existing) {
          return res.status(409).json({
            success: false,
            message: `'${updateData.name}' kategorisi zaten mevcut`,
          });
        }
      }

      await category.update(updateData);
    }

    const updated = await ServiceCategory.findByPk(category.id);
    successResponse(res, updated);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: `'${name}' kategorisi zaten mevcut`,
      });
    }
    next(error);
  }
};

// DELETE /categories/:id — Kategori sil (Admin)
const deleteCategory = async (req, res, next) => {
  try {
    const category = await ServiceCategory.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı',
      });
    }

    await category.destroy();
    successResponse(res, { message: 'Kategori başarıyla silindi' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
