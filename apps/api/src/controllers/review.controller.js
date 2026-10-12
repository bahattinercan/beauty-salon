const { sequelize } = require('../config/database');
const { Review, Appointment, Salon, User, Service } = require('../models');
const { successResponse, paginate, paginatedResponse } = require('../utils/helpers');

// POST /reviews
const create = async (req, res, next) => {
  try {
    const { appointmentId, rating, comment, images } = req.body;

    const appointment = await Appointment.findByPk(appointmentId, {
      include: [{ model: Review, as: 'review' }],
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Randevu bulunamadı' });
    }
    if (appointment.customerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bu randevu size ait değil' });
    }
    if (appointment.status !== 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Sadece tamamlanan randevulara yorum yapılabilir' });
    }
    if (appointment.review) {
      return res.status(400).json({ success: false, message: 'Bu randevuya zaten yorum yapılmış' });
    }

    // Transaction: review + salon rating güncelle
    const review = await sequelize.transaction(async (t) => {
      const newReview = await Review.create({
        customerId: req.user.id,
        salonId: appointment.salonId,
        appointmentId,
        rating,
        comment,
        images: images || [],
      }, { transaction: t });

      // Salon rating ortalamasını güncelle
      const result = await Review.findAll({
        where: { salonId: appointment.salonId, isVisible: true },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        raw: true,
        transaction: t,
      });

      await Salon.update({
        ratingAvg: Math.round((parseFloat(result[0].avgRating) || 0) * 10) / 10,
        reviewCount: parseInt(result[0].count) || 0,
      }, {
        where: { id: appointment.salonId },
        transaction: t,
      });

      return newReview;
    });

    const result = await Review.findByPk(review.id, {
      include: [
        { model: User, as: 'customer', attributes: ['id', 'fullName', 'avatarUrl'] },
      ],
    });

    successResponse(res, result, 201);
  } catch (error) {
    next(error);
  }
};

// GET /reviews/salon/:salonId
const getBySalon = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req.query.page, req.query.limit);

    const { count, rows } = await Review.findAndCountAll({
      where: { salonId: req.params.salonId, isVisible: true },
      include: [
        { model: User, as: 'customer', attributes: ['id', 'fullName', 'avatarUrl'] },
        {
          model: Appointment, as: 'appointment',
          attributes: ['id'],
          include: [{ model: Service, as: 'service', attributes: ['name'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    successResponse(res, paginatedResponse(rows, count, page, limit));
  } catch (error) {
    next(error);
  }
};

// GET /reviews/my
const getMyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.findAll({
      where: { customerId: req.user.id },
      include: [
        { model: Salon, as: 'salon', attributes: ['id', 'name', 'logoUrl'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    successResponse(res, reviews);
  } catch (error) {
    next(error);
  }
};

// PATCH /reviews/:id/reply (Salon owner)
const reply = async (req, res, next) => {
  try {
    const review = await Review.findByPk(req.params.id, {
      include: [{ model: Salon, as: 'salon', attributes: ['ownerId'] }],
    });

    if (!review) {
      return res.status(404).json({ success: false, message: 'Yorum bulunamadı' });
    }
    if (review.salon.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bu salona ait bir yorum değil' });
    }

    await review.update({
      salonReply: req.body.reply,
      salonReplyAt: new Date(),
    });

    successResponse(res, review);
  } catch (error) {
    next(error);
  }
};

// PATCH /reviews/:id/toggle-visibility (Admin)
const toggleVisibility = async (req, res, next) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Yorum bulunamadı' });
    }

    await review.update({ isVisible: !review.isVisible });
    successResponse(res, { id: review.id, isVisible: review.isVisible });
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getBySalon, getMyReviews, reply, toggleVisibility };
