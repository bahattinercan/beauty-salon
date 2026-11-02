// Yol parametresi UUID biçim kontrolü.
//
// Postgres, `uuid` kolonuna biçimsiz bir değer verildiğinde
// `invalid input syntax for type uuid` ile 500 üretiyordu (SQLite string'i sessizce
// eşleştirmediği için 404 dönüyordu). Bu middleware biçimsiz parametreyi controller'a
// göndermeden mevcut "bulunamadı" 404 sözleşmesiyle yanıtlar (400 değil — istemciler
// bu route'larda 404 bekliyor).
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Express param middleware imzası: (req, res, next, value, name)
const uuidParam = (message) => (req, res, next, value) => {
  if (UUID_PATTERN.test(String(value))) return next();
  return res.status(404).json({ success: false, message });
};

module.exports = { uuidParam, UUID_PATTERN };
