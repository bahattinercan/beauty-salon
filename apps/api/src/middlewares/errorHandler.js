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

  // Multer dosya hataları (boyut, adet, yanlış alan adı)
  if (err.name === 'MulterError') {
    const messages = {
      LIMIT_FILE_SIZE: 'Dosya boyutu çok büyük (max 5MB)',
      LIMIT_FILE_COUNT: 'En fazla 10 dosya yüklenebilir',
      LIMIT_UNEXPECTED_FILE: 'Beklenmeyen dosya alanı',
    };
    return res.status(400).json({
      success: false,
      message: messages[err.code] || 'Dosya yükleme hatası',
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
