// Global error handler middleware
const errorHandler = (err, req, res, _next) => {
  console.error(`[ERROR] ${req.method} ${req.url}:`, err.message);

  // Sequelize validation hataları
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Doğrulama hatası',
      errors,
    });
  }

  // Sequelize unique constraint
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'alan';
    return res.status(409).json({
      success: false,
      message: `Bu ${field} zaten kullanılıyor`,
    });
  }

  // Sequelize foreign key hatası
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'İlişkili kayıt bulunamadı',
    });
  }

  // Express-validator hataları
  if (err.type === 'validation') {
    return res.status(400).json({
      success: false,
      message: 'Doğrulama hatası',
      errors: err.errors,
    });
  }

  // Multer dosya boyutu
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Dosya boyutu çok büyük (max 5MB)',
    });
  }

  // Genel hata
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Sunucu hatası' : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
