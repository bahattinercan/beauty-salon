const { sequelize } = require('../config/database');
const { User, Salon, Appointment, Review, Staff, Service } = require('../models');
const { successResponse, paginate, paginatedResponse } = require('../utils/helpers');

// GET /admin/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const Op = require('sequelize').Op;

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
          [sequelize.fn('COUNT', sequelize.col('appointments.id')), 'count'],
        ],
        group: ['appointments.status'],
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
          [sequelize.fn('SUM', sequelize.col('services.price')), 'totalRevenue'],
          [sequelize.fn('COUNT', sequelize.col('appointments.id')), 'completedCount'],
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
          [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('appointments.date')), 'month'],
          [sequelize.fn('COUNT', sequelize.col('appointments.id')), 'count'],
        ],
        where: {
          date: {
            [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 6)),
          },
        },
        group: ['month'],
        order: [[sequelize.fn('month', sequelize.col('appointments.date')), 'ASC']],
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

    // Calculate revenue
    const revenueData = revenueStats.length > 0 ? revenueStats[0] : { totalRevenue: 0, completedCount: 0 };
    const totalRevenue = parseFloat(revenueData.totalRevenue || 0).toFixed(2);

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
    const where = {};
    if (req.query.verified !== undefined) where.isVerified = req.query.verified === 'true';

    const { count, rows } = await Salon.findAndCountAll({
      where,
      include: [{ model: User, as: 'owner', attributes: ['fullName', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    successResponse(res, paginatedResponse(rows, count, page, limit));
  } catch (error) {
    next(error);
  }
};

// GET /admin/appointments
const getAllAppointments = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req.query.page, req.query.limit);
    const where = {};
    if (req.query.status) where.status = req.query.status;

    const { count, rows } = await Appointment.findAndCountAll({
      where,
      include: [
        { model: User, as: 'customer', attributes: ['fullName', 'email'] },
        { model: Salon, as: 'salon', attributes: ['name'] },
        { model: Staff, as: 'staff', attributes: ['fullName'] },
        { model: Service, as: 'service', attributes: ['name', 'price'] },
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

// GET /admin/reviews
const getAllReviews = async (req, res, next) => {
  try {
    const { limit, offset, page } = paginate(req.query.page, req.query.limit);

    const { count, rows } = await Review.findAndCountAll({
      include: [
        { model: User, as: 'customer', attributes: ['fullName'] },
        { model: Salon, as: 'salon', attributes: ['name'] },
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

module.exports = { getDashboard, getAllSalons, getAllAppointments, getAllReviews };
