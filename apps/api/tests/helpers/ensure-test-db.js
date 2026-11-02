'use strict';

/**
 * Test DB'sini hazırlar — `npm test` öncesi tek komut:
 *
 *   cd apps/api && node tests/helpers/ensure-test-db.js
 *
 * Yaptığı iş:
 *  1. `.env.test` dosyasını yükler (yalnız bu dosya; gerçek `.env`'e dokunmaz).
 *  2. Postgres'e `postgres` bakım DB'si üzerinden bağlanır, `DB_NAME` (varsayılan
 *     `beauty_salon_test`) yoksa `CREATE DATABASE` ile oluşturur; varsa atlar.
 *  3. `src/database/migrations/` altındaki tüm migration'ları in-process koşar
 *     (`SequelizeMeta` ile aynı sözleşme; `sequelize-cli db:migrate` ile eşdeğer).
 *  4. Özet basar ve bağlantıları kapatır.
 *
 * `DROP DATABASE` yapmaz, dev (`beauty_salon`) DB'sine dokunmaz.
 */

const path = require('path');
const dotenv = require('dotenv');

const ENV_FILE = path.resolve(__dirname, '..', '..', '.env.test');
const result = dotenv.config({ path: ENV_FILE });
if (result.error && result.error.code !== 'ENOENT') {
  throw result.error;
}

process.env.NODE_ENV = 'test';

const { Client } = require('pg');
const { sequelize } = require('../../src/config/database');
const { ensureTestSchema } = require('./migrator');

const MAINTAINANCE_DB = 'postgres';
const SAFE_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

const connectionOptions = (database) => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database,
});

const resolveDatabaseName = () =>
  process.env.DB_NAME_TEST || process.env.DB_NAME || 'beauty_salon_test';

const ensureDatabaseExists = async (databaseName) => {
  if (!SAFE_IDENTIFIER.test(databaseName)) {
    throw new Error(`Geçersiz veritabanı adı: "${databaseName}"`);
  }

  const client = new Client(connectionOptions(MAINTAINANCE_DB));
  await client.connect();
  try {
    const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      databaseName,
    ]);
    if (rowCount > 0) return false;
    await client.query(`CREATE DATABASE "${databaseName}"`);
    return true;
  } finally {
    await client.end();
  }
};

const main = async () => {
  const dialect = (process.env.DB_DIALECT || 'postgres').toLowerCase();
  if (dialect !== 'postgres') {
    throw new Error(
      `Test DB hazırlığı Postgres gerektirir; .env.test içinde DB_DIALECT=postgres olmalı (şu an: "${dialect}")`
    );
  }

  const databaseName = resolveDatabaseName();
  const created = await ensureDatabaseExists(databaseName);
  console.log(`DB: ${databaseName} @ ${process.env.DB_HOST}:${process.env.DB_PORT} — ${created ? 'oluşturuldu' : 'zaten var'}`);

  await sequelize.authenticate();
  const migrations = await ensureTestSchema(sequelize, { log: console.log });

  console.log(
    `Migration: ${migrations.applied}/${migrations.total} uygulanmış` +
      (migrations.pending > 0 ? ` (bu koşumda ${migrations.pending} yeni)` : ' (bekleyen yok)')
  );
  console.log('Test DB hazır.');
};

main()
  .catch((error) => {
    console.error('Test DB hazırlanamadı:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close().catch(() => {});
  });
