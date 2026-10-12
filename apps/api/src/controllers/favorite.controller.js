const { Favorite, Salon } = require('../models');
const { successResponse } = require('../utils/helpers');

// POST /favorites/:salonId (toggle)
const toggle = async (req, res, next) => {
  try {
    const { salonId } = req.params;
    const userId = req.user.id;

    const existing = await Favorite.findOne({ where: { userId, salonId } });

    if (existing) {
      await existing.destroy();
      return successResponse(res, { isFavorite: false });
    }

    const salon = await Salon.findByPk(salonId);
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon bulunamadı' });
    }

    await Favorite.create({ userId, salonId });
    successResponse(res, { isFavorite: true });
  } catch (error) {
    next(error);
  }
};

// GET /favorites
const getMyFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.findAll({
      where: { userId: req.user.id },
      include: [{
        model: Salon,
        as: 'salon',
        attributes: ['id', 'name', 'logoUrl', 'coverImageUrl', 'address', 'ratingAvg', 'reviewCount', 'city', 'district'],
      }],
      order: [['createdAt', 'DESC']],
    });

    const salons = favorites.map(f => f.salon).filter(Boolean);
    successResponse(res, salons);
  } catch (error) {
    next(error);
  }
};

// GET /favorites/:salonId/check
const check = async (req, res, next) => {
  try {
    const fav = await Favorite.findOne({
      where: { userId: req.user.id, salonId: req.params.salonId },
    });
    successResponse(res, { isFavorite: !!fav });
  } catch (error) {
    next(error);
  }
};

module.exports = { toggle, getMyFavorites, check };
