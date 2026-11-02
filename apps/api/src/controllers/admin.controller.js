const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const { User, Salon, Appointment, Review, Staff, Service } = require('../models');
const { successResponse, paginate, paginatedResponse } = require('../utils/helpers');

// Paneldeki türetilmiş durum -> Salon kolonları (AP-007 §4.1)
const SALON_STATUS_FILTERS = {
  'onaylı': { isActive: true, isVerified: true },
  'bekliyor': { isActive: true, isVerified: false },
  'pasif': { isActive: false },
};

// Sıralama parametresi -> Salon kolonu
const SALON_SORT_COLUMNS = {
  createdAt: 'createdAt',
  name: 'name',
  rating: 'ratingAvg',
};

// Paneldeki randevu durum sayaçları (meta.counts) — sıra sabit
const APPOINTMENT_STATUS_VALUES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

// Sıralama parametresi -> Appointment kolonu
const APPOINTMENT_SORT_COLUMNS = {
  createdAt: 'createdAt',
  date: 'date',
};

// Sıralama parametresi -> Review kolonu
const REVIEW_SORT_COLUMNS = {
  createdAt: 'createdAt',
  rating: 'rating',
};

// Puan dağılımı anahtarları sabit: eksik puanlar 0 olarak döner
const REVIEW_RATING_KEYS = ['1', '2', '3', '4', '5'];

// GET /admin/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const Op = require('sequelize').Op;

    // Aylık gruplama ifadesi dialect'e göre: SQLite'ta strftime, Postgres'te date_trunc.
    // Kolon referansı sequelize.col ile verilir; ham literal'e `Appointment.date` yazmak
    // Postgres'te tırnaksız kaldığı için "missing FROM-clause entry for table \"appointment\"" üretiyordu.
    const appointmentMonth =
      sequelize.getDialect() === 'sqlite'
        ? sequelize.fn('strftime', '%Y-%m', sequelize.col('Appointment.date'))
        : sequelize.fn('date_trunc', 'month', sequelize.col('Appointment.date'));

    const [
      totalUsers,
      totalSalons,
      totalAppointments,
      pendingSalons,
      recentAppointments,
      newUsersThisWeek,
      appointmentsByStatus,
      recentReviews,
      revenueStats,
      monthlyAppointments,
    ] = await Promise.all([
      User.count(),
      Salon.count({ where: { isActive: true } }),
      Appointment.count(),
      Salon.count({ where: { isVerified: false, isActive: true } }),
      Appointment.count({ where: { createdAt: { [Op.gte]: sevenDaysAgo } } }),
      User.count({ where: { createdAt: { [Op.gte]: sevenDaysAgo } } }),
      Appointment.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('Appointment.id')), 'count'],
        ],
        group: ['Appointment.status'],
        raw: true,
      }),
      Review.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [
          { model: User, as: 'customer', attributes: ['fullName'] },
          { model: Salon, as: 'salon', attributes: ['name'] },
        ],
      }),
      // Revenue: sum of service prices for COMPLETED appointments
      Appointment.findAll({
        where: { status: 'COMPLETED' },
        attributes: [
          [sequelize.fn('SUM', sequelize.col('service.price')), 'totalRevenue'],
          [sequelize.fn('COUNT', sequelize.col('Appointment.id')), 'completedCount'],
        ],
        include: [
          {
            model: Service,
            as: 'service',
            attributes: [],
            required: true,
          },
        ],
        raw: true,
      }),
      // Monthly appointment counts for the last 6 months
      Appointment.findAll({
        attributes: [
          [appointmentMonth, 'month'],
          [sequelize.fn('COUNT', sequelize.col('Appointment.id')), 'count'],
        ],
        where: {
          date: {
            [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 6)),
          },
        },
        group: ['month'],
        order: [[appointmentMonth, 'ASC']],
        raw: true,
      }),
    ]);

    // Format appointmentsByStatus into a consistent shape
    const statusMap = {
      CONFIRMED: 'ONAYLANDI',
      COMPLETED: 'TAMAMLANDI',
      CANCELLED: 'IPTAL EDILDI',
      PENDING: 'BEKLEMEDE',
      NO_SHOW: 'GEÇ_KALDI',
    };

    const formattedAppointmentsByStatus = appointmentsByStatus.map((item) => ({
      name: statusMap[item.status] || item.status,
      value: parseInt(item.count, 10),
      color: item.status === 'CONFIRMED' ? '#7CB69D'
        : item.status === 'COMPLETED' ? '#64B5F6'
        : item.status === 'CANCELLED' ? '#E57373'
        : '#FFB74D',
    }));

    // Calculate revenue — istemci string'e çevirmesin diye number döner (#14)
    const revenueData = revenueStats.length > 0 ? revenueStats[0] : { totalRevenue: 0, completedCount: 0 };
    const totalRevenue = Math.round((parseFloat(revenueData.totalRevenue || 0) || 0) * 100) / 100;

    // Format monthly data
    const monthlyData = monthlyAppointments.map((item) => {
      const d = new Date(item.month);
      const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      return {
        name: monthNames[d.getMonth()],
        appointments: parseInt(item.count, 10),
      };
    });

    successResponse(res, {
      stats: {
        totalUsers,
        totalSalons,
        totalAppointments,
        pendingSalons,
        recentAppointments,
        newUsersThisWeek,
        totalRevenue,
        completedAppointments: parseInt(revenueData.completedCount || 0, 10),
      },
      appointmentsByStatus: formattedAppointmentsByStatus,
      monthlyAppointments: monthlyData,
      recentReviews,
    });
  } catch (error) {
    next(error);
  }
};

// GET /admin/salons
const getAllSalons = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req.query.page, req.query.limit);
    const {
      search, status, city, district, minRating,
      sort = 'createdAt', order = 'desc', verified,
    } = req.query;

    const where = {};
    const conditions = [];
    if (verified !== undefined) conditions.push({ isVerified: verified === 'true' });
    if (status) conditions.push(SALON_STATUS_FILTERS[status]);
    if (city) conditions.push({ city: { [Op.like]: city } });
    if (district) conditions.push({ district: { [Op.like]: district } });
    if (minRating !== undefined && minRating !== '') {
      conditions.push({ ratingAvg: { [Op.gte]: parseFloat(minRating) } });
    }
    if (search) {
      // Sahip araması üst seviye where içinde: include.where count'u bozar (AP-007 R1).
      // `$owner.fullName$` SQLite'ta alan adına çevrilmiyor → LOWER(kolon) LIKE ile açıkça yazılıyor.
      const term = `%${String(search).toLowerCase()}%`;
      const lowerLike = (column) => sequelize.where(
        sequelize.fn('LOWER', sequelize.col(column)),
        { [Op.like]: term },
      );
      conditions.push({
        [Op.or]: [
          lowerLike('Salon.name'),
          lowerLike('Salon.address'),
          lowerLike('Salon.city'),
          lowerLike('Salon.district'),
          lowerLike('owner.full_name'),
          lowerLike('owner.email'),
        ],
      });
    }
    if (conditions.length) where[Op.and] = conditions;

    const orderColumn = SALON_SORT_COLUMNS[sort] || 'createdAt';
    const orderDirection = order === 'asc' ? 'ASC' : 'DESC';

    // counts/cities filtrelerden bağımsız (global) — panel sekmeleri ve şehir select'i için
    const [result, totalSalons, verifiedSalons, pendingSalons, inactiveSalons, cityRows] = await Promise.all([
      Salon.findAndCountAll({
        where,
        include: [{ model: User, as: 'owner', attributes: ['fullName', 'email'] }],
        order: [[orderColumn, orderDirection]],
        limit,
        offset,
        distinct: true,
        subQuery: false,
      }),
      Salon.count(),
      Salon.count({ where: { isActive: true, isVerified: true } }),
      Salon.count({ where: { isActive: true, isVerified: false } }),
      Salon.count({ where: { isActive: false } }),
      Salon.findAll({ attributes: ['city'], group: ['city'], order: [['city', 'ASC']], raw: true }),
    ]);

    const payload = paginatedResponse(result.rows, result.count, page, limit);
    payload.meta.counts = {
      'tümü': totalSalons,
      'onaylı': verifiedSalons,
      'bekliyor': pendingSalons,
      'pasif': inactiveSalons,
    };
    payload.meta.cities = cityRows.map((row) => row.city).filter(Boolean);

    successResponse(res, payload);
  } catch (error) {
    next(error);
  }
};

// GET /admin/appointments
const getAllAppointments = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req.query.page, req.query.limit);
    const {
      search, status, salonId, staffId, dateFrom, dateTo,
      sort = 'createdAt', order = 'desc',
    } = req.query;

    const conditions = [];
    if (status) conditions.push({ status });
    if (salonId) conditions.push({ salonId });
    if (staffId) conditions.push({ staffId });
    if (dateFrom || dateTo) {
      // date DATEONLY: YYYY-MM-DD string karşılaştırması yeterli
      const dateRange = {};
      if (dateFrom) dateRange[Op.gte] = dateFrom;
      if (dateTo) dateRange[Op.lte] = dateTo;
      conditions.push({ date: dateRange });
    }
    if (search) {
      // Arama ilişkili tablolarda: include.where count'u bozar (AP-007 R1).
      // `$customer.fullName$` SQLite'ta alan adına çevrilmiyor → LOWER(kolon) LIKE ile açıkça yazılıyor.
      const term = `%${String(search).toLowerCase()}%`;
      const lowerLike = (column) => sequelize.where(
        sequelize.fn('LOWER', sequelize.col(column)),
        { [Op.like]: term },
      );
      conditions.push({
        [Op.or]: [
          lowerLike('customer.full_name'),
          lowerLike('customer.email'),
          lowerLike('salon.name'),
          lowerLike('staff.full_name'),
          lowerLike('service.name'),
        ],
      });
    }
    const where = conditions.length ? { [Op.and]: conditions } : {};

    const orderColumn = APPOINTMENT_SORT_COLUMNS[sort] || 'createdAt';
    const orderDirection = order === 'asc' ? 'ASC' : 'DESC';
    // sort=date: aynı gün içinde saat sırası ikincil anahtar
    const orderClause = sort === 'date'
      ? [[orderColumn, orderDirection], ['startTime', 'ASC']]
      : [[orderColumn, orderDirection]];

    const [result, totalAppointments, statusRows, salonIdRows, staffIdRows] = await Promise.all([
      Appointment.findAndCountAll({
        where,
        include: [
          { model: User, as: 'customer', attributes: ['fullName', 'email'] },
          { model: Salon, as: 'salon', attributes: ['name'] },
          { model: Staff, as: 'staff', attributes: ['fullName'] },
          { model: Service, as: 'service', attributes: ['name', 'price'] },
        ],
        order: orderClause,
        limit,
        offset,
        distinct: true,
        subQuery: false,
      }),
      Appointment.count(),
      // counts filtrelerden bağımsız (global) — panel durum sekmeleri için
      Appointment.findAll({
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'n']],
        group: ['status'],
        raw: true,
      }),
      // salon/staff select'leri de global: randevularda geçen küme
      Appointment.findAll({ attributes: ['salonId'], group: ['salonId'], raw: true }),
      Appointment.findAll({ attributes: ['staffId'], group: ['staffId'], raw: true }),
    ]);

    const salonIds = salonIdRows.map((row) => row.salonId).filter(Boolean);
    const staffIds = staffIdRows.map((row) => row.staffId).filter(Boolean);

    const [salons, staffMembers] = await Promise.all([
      salonIds.length
        ? Salon.findAll({
          where: { id: { [Op.in]: salonIds } },
          attributes: ['id', 'name'],
          order: [['name', 'ASC']],
          raw: true,
        })
        : [],
      staffIds.length
        ? Staff.findAll({
          where: { id: { [Op.in]: staffIds } },
          attributes: ['id', 'fullName'],
          order: [['fullName', 'ASC']],
          raw: true,
        })
        : [],
    ]);

    const counts = { 'tümü': totalAppointments };
    APPOINTMENT_STATUS_VALUES.forEach((value) => { counts[value] = 0; });
    statusRows.forEach((row) => { counts[row.status] = parseInt(row.n, 10); });

    const payload = paginatedResponse(result.rows, result.count, page, limit);
    payload.meta.counts = counts;
    payload.meta.salons = salons.map((salon) => ({ id: salon.id, name: salon.name }));
    payload.meta.staff = staffMembers.map((member) => ({ id: member.id, fullName: member.fullName }));

    successResponse(res, payload);
  } catch (error) {
    next(error);
  }
};

// GET /admin/reviews
const getAllReviews = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req.query.page, req.query.limit);
    const {
      search, rating, visibility = 'all', replied = 'all', salonId,
      dateFrom, dateTo, sort = 'createdAt', order = 'desc',
    } = req.query;

    const conditions = [];
    if (rating !== undefined && rating !== '') conditions.push({ rating: parseInt(rating, 10) });
    if (visibility === 'visible') conditions.push({ isVisible: true });
    if (visibility === 'hidden') conditions.push({ isVisible: false });
    if (replied === 'replied') conditions.push({ salonReply: { [Op.ne]: null } });
    if (replied === 'unreplied') conditions.push({ salonReply: null });
    if (salonId) conditions.push({ salonId });
    if (dateFrom || dateTo) {
      // Gün sınırı YEREL takvimde kuruluyor: panel `YYYY-MM-DD` tarihini yerel günden üretiyor
      // (`reviewsQuery.localDate`). `Z` ile (UTC) parse edilirse sınır UTC+3'te 3 saat kayıyor
      // ve günün ilk saatlerindeki yorumlar filtreden düşüyordu (AP-010 §10 S2).
      const dateRange = {};
      if (dateFrom) dateRange[Op.gte] = new Date(`${dateFrom}T00:00:00.000`);
      if (dateTo) dateRange[Op.lte] = new Date(`${dateTo}T23:59:59.999`);
      conditions.push({ createdAt: dateRange });
    }
    if (search) {
      // Arama ilişkili tablolarda: include.where count'u bozar (AP-007 R1).
      // `$customer.fullName$` SQLite'ta alan adına çevrilmiyor → LOWER(kolon) LIKE ile açıkça yazılıyor.
      const term = `%${String(search).toLowerCase()}%`;
      const lowerLike = (column) => sequelize.where(
        sequelize.fn('LOWER', sequelize.col(column)),
        { [Op.like]: term },
      );
      conditions.push({
        [Op.or]: [
          lowerLike('customer.full_name'),
          lowerLike('salon.name'),
          lowerLike('Review.comment'),
        ],
      });
    }
    const where = conditions.length ? { [Op.and]: conditions } : {};

    const orderColumn = REVIEW_SORT_COLUMNS[sort] || 'createdAt';
    const orderDirection = order === 'asc' ? 'ASC' : 'DESC';
    // sort=rating: eşit puanda yeni yorum önce gelsin
    const orderClause = sort === 'rating'
      ? [[orderColumn, orderDirection], ['createdAt', 'DESC']]
      : [[orderColumn, orderDirection]];

    const [
      result, totalReviews, visibleCount, hiddenCount, repliedCount, unrepliedCount,
      ratingRows, salonIdRows,
    ] = await Promise.all([
      Review.findAndCountAll({
        where,
        include: [
          { model: User, as: 'customer', attributes: ['fullName'] },
          { model: Salon, as: 'salon', attributes: ['name'] },
        ],
        order: orderClause,
        limit,
        offset,
        distinct: true,
        subQuery: false,
      }),
      // counts/ratings/salons filtrelerden bağımsız (global) — panel sekmeleri ve select'ler için
      Review.count(),
      Review.count({ where: { isVisible: true } }),
      Review.count({ where: { isVisible: false } }),
      Review.count({ where: { salonReply: { [Op.ne]: null } } }),
      Review.count({ where: { salonReply: null } }),
      Review.findAll({
        attributes: ['rating', [sequelize.fn('COUNT', sequelize.col('id')), 'n']],
        group: ['rating'],
        raw: true,
      }),
      // salon select'i de global: yorumu olan salonların kümesi
      Review.findAll({ attributes: ['salonId'], group: ['salonId'], raw: true }),
    ]);

    const ratings = {};
    REVIEW_RATING_KEYS.forEach((key) => { ratings[key] = 0; });
    ratingRows.forEach((row) => { ratings[String(row.rating)] = parseInt(row.n, 10); });

    const reviewSalonIds = salonIdRows.map((row) => row.salonId).filter(Boolean);
    const salons = reviewSalonIds.length
      ? await Salon.findAll({
        where: { id: { [Op.in]: reviewSalonIds } },
        attributes: ['id', 'name'],
        order: [['name', 'ASC']],
        raw: true,
      })
      : [];

    const payload = paginatedResponse(result.rows, result.count, page, limit);
    payload.meta.counts = {
      all: totalReviews,
      visible: visibleCount,
      hidden: hiddenCount,
      replied: repliedCount,
      unreplied: unrepliedCount,
    };
    payload.meta.ratings = ratings;
    payload.meta.salons = salons.map((salon) => ({ id: salon.id, name: salon.name }));

    successResponse(res, payload);
  } catch (error) {
    next(error);
  }
};

// PATCH /admin/reviews/:id/reply
const replyToReview = async (req, res, next) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Yorum bulunamadı' });
    }

    await review.update({
      salonReply: req.body.reply,
      salonReplyAt: new Date(),
    });

    successResponse(res, {
      id: review.id,
      salonReply: review.salonReply,
      salonReplyAt: review.salonReplyAt,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /admin/reviews/:id
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Yorum bulunamadı' });
    }

    const reviewId = review.id;
    const { salonId } = review;

    // Silme + salon puanının yeniden hesabı tek transaction'da (review.controller.create deseni)
    const rating = await sequelize.transaction(async (t) => {
      await review.destroy({ transaction: t });

      const rows = await Review.findAll({
        where: { salonId, isVisible: true },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        raw: true,
        transaction: t,
      });

      const ratingAvg = Math.round((parseFloat(rows[0].avgRating) || 0) * 10) / 10;
      const reviewCount = parseInt(rows[0].count, 10) || 0;

      await Salon.update({ ratingAvg, reviewCount }, {
        where: { id: salonId },
        transaction: t,
      });

      return { ratingAvg, reviewCount };
    });

    successResponse(res, {
      id: reviewId,
      salonId,
      ratingAvg: rating.ratingAvg,
      reviewCount: rating.reviewCount,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getAllSalons,
  getAllAppointments,
  getAllReviews,
  replyToReview,
  deleteReview,
};
