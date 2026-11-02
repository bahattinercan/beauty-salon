// Rate limit tanımları tek yerde (app.js yalnız mount eder).
//
// Test ortamında limitler VARSAYILAN OLARAK KAPALI: aksi halde art arda gelen
// supertest çağrıları 429 dönüp auth testlerini kırıyor. Kapalı olma durumu
// istek anında okunur (`skip`), böylece bir test `setRateLimitEnabled(true)` ile
// yalnız kendi kapsamında limiti açıp 429 davranışını doğrulayabilir (#32).
const rateLimit = require('express-rate-limit');

const isTest = process.env.NODE_ENV === 'test';

// Express uygulaması bir kez kurulur; bu yüzden açma/kapama modül durumunda tutulur
// ve her istekte okunur.
const state = { enabled: !isTest };

const setRateLimitEnabled = (enabled) => {
  state.enabled = Boolean(enabled);
};

const isRateLimitEnabled = () => state.enabled;

// Limiti atla (kapalıyken hiç sayım yapılmaz)
const skip = () => !state.enabled;

const envInt = (name, fallback) => {
  const value = parseInt(process.env[name], 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

// Genel API limiti
const generalLimiter = rateLimit({
  windowMs: envInt('RATE_LIMIT_WINDOW', 60000),
  limit: () => envInt('RATE_LIMIT_MAX', 100),
  message: { success: false, message: 'Çok fazla istek gönderildi, lütfen bekleyiniz' },
  standardHeaders: true,
  legacyHeaders: false,
  skip,
});

// Login/register için sıkı limit (brute force). Eşik env ile düşürülebilir.
const authLimiter = rateLimit({
  windowMs: 60000,
  limit: () => envInt('RATE_LIMIT_AUTH_MAX', 10),
  message: { success: false, message: 'Çok fazla giriş denemesi, lütfen 1 dakika bekleyiniz' },
  standardHeaders: true,
  legacyHeaders: false,
  skip,
});

// Refresh token için daha geniş limit (uygulama otomatik çağırır)
const refreshLimiter = rateLimit({
  windowMs: 60000,
  limit: () => envInt('RATE_LIMIT_REFRESH_MAX', 60),
  message: { success: false, message: 'Çok fazla token yenileme isteği' },
  standardHeaders: true,
  legacyHeaders: false,
  skip,
});

module.exports = {
  generalLimiter,
  authLimiter,
  refreshLimiter,
  setRateLimitEnabled,
  isRateLimitEnabled,
};
