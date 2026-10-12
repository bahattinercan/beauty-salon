# Plan 6: Error Handling

## Durum: ✅ tamamlandı

`src/middlewares/errorHandler.js` global olarak bağlı.
Kapsanan hata tipleri: SequelizeValidationError, UniqueConstraint, ForeignKey,
express-validator, Multer LIMIT_FILE_SIZE, generic (statusCode).
Stack yalnızca `NODE_ENV=development`'ta dönüyor.

## Kalan
- 404 handler yok: bilinmeyen bir route Express'in default 404 HTML'ine düşüyor
  (`GET /api/v1/olmayan-route` → JSON değil).
- `err.statusCode` set eden yer yok; controller'lar genelde doğrudan `res.status(...)` kullanıyor.
