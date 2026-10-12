// Load environment - use .env.test when in test mode
const envPath = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
require('dotenv').config({ path: require('path').join(__dirname, '..', envPath) });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// ==================== GÜVENLİK ====================

// Helmet - HTTP güvenlik headerları
app.use(helmet());

// CORS - izin verilen originler
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8080',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting - brute force koruması
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: 'Çok fazla istek gönderildi, lütfen bekleyiniz' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Login/register için sıkı rate limit (brute force)
const authLimiter = rateLimit({
  windowMs: 60000,
  max: 10,
  message: { success: false, message: 'Çok fazla giriş denemesi, lütfen 1 dakika bekleyiniz' },
});
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// Refresh token için daha geniş limit (uygulama otomatik çağırır)
const refreshLimiter = rateLimit({
  windowMs: 60000,
  max: 60,
  message: { success: false, message: 'Çok fazla token yenileme isteği' },
});
app.use('/api/v1/auth/refresh', refreshLimiter);

// ==================== PARSER ====================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ==================== LOGGING ====================

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ==================== STATIC FILES ====================

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ==================== ROUTES ====================

app.use(process.env.API_PREFIX || '/api/v1', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route bulunamadı: ${req.method} ${req.url}`,
  });
});

// ==================== ERROR HANDLER ====================

app.use(errorHandler);

module.exports = app;
