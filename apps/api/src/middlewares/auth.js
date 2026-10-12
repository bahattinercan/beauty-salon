const jwt = require('jsonwebtoken');
const { User } = require('../models');

// JWT doğrulama middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Erişim için giriş yapmanız gerekiyor',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.sub, {
      attributes: ['id', 'email', 'fullName', 'role', 'isActive', 'isVerified'],
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz veya devre dışı hesap',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Oturum süresi dolmuş, lütfen tekrar giriş yapın',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz token',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Kimlik doğrulama hatası',
    });
  }
};

// Opsiyonel auth - giriş yapmamış da olabilir
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.sub, {
        attributes: ['id', 'email', 'fullName', 'role', 'isActive'],
      });
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (_) {
    // Token geçersizse sessizce devam et
  }
  next();
};

// Rol kontrolü middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Erişim için giriş yapmanız gerekiyor',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için yetkiniz bulunmuyor',
      });
    }

    next();
  };
};

module.exports = { authenticate, optionalAuth, authorize };
