const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { ServiceCategory, Service } = require('../models');
const { successResponse } = require('../utils/helpers');

// GET /categories — Tüm kategorileri getir (sıralı)
const getCategories = async (req, res, next) => {
  try {
    const [categories, counts] = await Promise.all([
      ServiceCategory.findAll({ order: [['sortOrder', 'ASC']] }),
      Service.findAll({
        attributes: [
          'categoryId',
          [sequelize.fn('COUNT', sequelize.col('id')), 'serviceCount'],
        ],
        group: ['categoryId'],
        raw: true,
      }),
    ]);

    const countMap = Object.fromEntries(
      counts.map((c) => [c.categoryId, Number(c.serviceCount)])
    );

    successResponse(
      res,
      categories.map((c) => ({
        ...c.toJSON(),
        serviceCount: countMap[c.id] ?? 0,
      }))
    );
  } catch (error) {
    next(error);
  }
};

// POST /categories — Yeni kategori oluştur (Admin)
const createCategory = async (req, res, next) => {
  const { name, iconName, sortOrder, description, isActive } = req.body;

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
      description: description ?? null,
      isActive: isActive === undefined ? true : Boolean(isActive),
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
  const { name, iconName, sortOrder, description, isActive } = req.body;

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
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

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
