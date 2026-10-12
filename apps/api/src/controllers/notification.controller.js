const { Notification } = require('../models');
const { successResponse } = require('../utils/helpers');
const { paginate } = require('../utils/helpers');

// GET /notifications - Kullanıcının bildirimleri (sayfalı, filtreli)
const getMy = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page, limit, isRead, type } = req.query;
    const { offset, limit: l } = paginate(page, limit);

    const where = { user_id: userId };

    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }
    if (type) {
      where.type = type;
    }

    const { count, rows } = await Notification.findAndCountAll({
      where,
      limit: l,
      offset,
      order: [['createdAt', 'DESC']],
    });

    successResponse(res, {
      data: rows,
      meta: {
        total: count,
        page: parseInt(page) || 1,
        limit: l,
        totalPages: Math.ceil(count / l),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /notifications/unread-count - Okunmamış bildirim sayısı
const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const count = await Notification.count({
      where: { user_id: userId, isRead: false },
    });

    successResponse(res, { count });
  } catch (error) {
    next(error);
  }
};

// PATCH /notifications/:id/read - Tekil bildirimi okundu işaretle
const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notification = await Notification.findOne({
      where: { id: req.params.id, user_id: userId },
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Bildirim bulunamadı' });
    }

    await notification.update({ isRead: true });
    successResponse(res, notification);
  } catch (error) {
    next(error);
  }
};

// PATCH /notifications/read-all - Tüm bildirimleri okundu işaretle
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await Notification.update(
      { isRead: true },
      { where: { user_id: userId, isRead: false } }
    );

    successResponse(res, { message: 'Tüm bildirimler okundu olarak işaretlendi' });
  } catch (error) {
    next(error);
  }
};

// DELETE /notifications/:id - Bildirimi sil
const remove = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notification = await Notification.findOne({
      where: { id: req.params.id, user_id: userId },
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Bildirim bulunamadı' });
    }

    await notification.destroy();
    successResponse(res, { message: 'Bildirim silindi' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMy, getUnreadCount, markAsRead, markAllAsRead, remove };
