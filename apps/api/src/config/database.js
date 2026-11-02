const { Sequelize } = require('sequelize');
const path = require('path');

// Tek doğruluk kaynağı: dialect env'den gelir (varsayılan postgres).
const SUPPORTED_DIALECTS = ['postgres', 'sqlite'];

// Postgres `NUMERIC`/`DECIMAL` (OID 1700) `pg` tarafından string ('5.00') dönüyor;
// SQLite aynı kolonlar için sayı dönüyordu. API sözleşmesi (Flutter `double.parse`/`num`,
// admin_panel `Number()`) sayı beklediği için tek noktadan parseFloat uygulanır — model
// getter'ı yerine sürücü seviyesinde çözülür ki `raw: true` sorguları (revenue, admin
// listeleri) da aynı tipi döndürsün.
//
// Dikkat: Sequelize bağlantı kurulunca kendi DECIMAL parser'ını kaydediyor
// (`dialects/postgres/data-types.js` → `DECIMAL.parse = value`), bu da `pg`'nin OID
// parser'ını gölgeliyor. Bu yüzden aynı dönüşüm Sequelize'ın DECIMAL static'ine de verilir;
// numeric[] (array) parser'ı da aynı fonksiyonu kullanır.
const NUMERIC_OID = 1700;
const parseNumeric = (value) => (value === null ? null : parseFloat(value));
const enablePgNumericParsing = () => {
  require('pg').types.setTypeParser(NUMERIC_OID, parseNumeric);
  const { DataTypes } = require('sequelize');
  if (DataTypes.postgres && DataTypes.postgres.DECIMAL) {
    DataTypes.postgres.DECIMAL.parse = parseNumeric;
  }
};

// SQLite yalnızca geri dönüş yolu: DB_DIALECT=sqlite verilmedikçe devreye girmez.
const SQLITE_FALLBACK_FILES = {
  test: 'test-database.sqlite',
  development: 'database.sqlite',
  production: 'database.sqlite',
};

const resolveDialect = () => {
  const dialect = (process.env.DB_DIALECT || 'postgres').toLowerCase();
  if (!SUPPORTED_DIALECTS.includes(dialect)) {
    throw new Error(
      `Geçersiz DB_DIALECT: "${dialect}" (desteklenen: ${SUPPORTED_DIALECTS.join(' | ')})`
    );
  }
  return dialect;
};

const resolveSqliteStorage = (env) => {
  if (process.env.DB_STORAGE) return path.resolve(process.env.DB_STORAGE);
  const file = SQLITE_FALLBACK_FILES[env] || SQLITE_FALLBACK_FILES.development;
  return path.join(__dirname, '..', file);
};

/**
 * Runtime (`server.js`, modeller) ve sequelize-cli (`sequelize-config.js`) için
 * tek connection factory. Dönen nesne hem `new Sequelize(options)` hem de
 * sequelize-cli config sözleşmesiyle uyumludur (database/username/password).
 */
const buildSequelizeOptions = (env = process.env.NODE_ENV || 'development') => {
  const dialect = resolveDialect();

  const common = {
    dialect,
    // Geliştirmede SQL log'u açık; test ve production sessiz.
    logging: env === 'development' ? console.log : false,
    define: {
      underscored: true,
      timestamps: true,
    },
  };

  if (dialect === 'sqlite') {
    return {
      ...common,
      storage: resolveSqliteStorage(env),
    };
  }

  return {
    ...common,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database:
      env === 'test'
        ? process.env.DB_NAME_TEST || process.env.DB_NAME || 'beauty_salon_test'
        : process.env.DB_NAME || 'beauty_salon',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    timezone: 'UTC',
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  };
};

if (resolveDialect() === 'postgres') enablePgNumericParsing();

const sequelize = new Sequelize(buildSequelizeOptions());

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`${sequelize.dialect.name} bağlantısı başarılı`);
  } catch (error) {
    console.error('Veritabanı bağlantı hatası:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB, buildSequelizeOptions, resolveDialect };
