'use strict';

/**
 * In-process migration runner — `sequelize-cli db:migrate` ile aynı işi yapar:
 * `src/database/migrations/` altındaki dosyaları sırayla koşar ve uygulananları
 * `SequelizeMeta` tablosuna yazar (biçim sequelize-cli ile birebir, aynı DB'de
 * ikisi birbirinin işini görür).
 *
 * Neden in-process: `npm test` alt süreç doğurup CLI'ya bağımlı olmasın; test DB'si
 * her koşumda aynı kuralla (migration = tek doğruluk kaynağı) hazırlanabilsin.
 * Yeni npm bağımlılığı yok: yalnız `sequelize` + `fs`.
 */

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

const MIGRATIONS_DIR = path.resolve(__dirname, '..', '..', 'src', 'database', 'migrations');
const META_TABLE = 'SequelizeMeta';

const listMigrationFiles = () =>
  fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.js'))
    .sort();

const tableNames = async (queryInterface) => {
  const tables = await queryInterface.showAllTables();
  return tables.map((table) => (typeof table === 'string' ? table : table.tableName));
};

const ensureMetaTable = async (queryInterface) => {
  const names = await tableNames(queryInterface);
  if (names.includes(META_TABLE)) return;
  await queryInterface.createTable(META_TABLE, {
    name: { type: Sequelize.STRING, allowNull: false, primaryKey: true },
  });
};

// `sequelize.query` bu yığında satırları dizi olarak da döndürebiliyor (pg rowMode);
// tek kolonluk SELECT'lerde iki şekli de kabul et.
const columnValues = (rows, key) => rows.map((row) => (Array.isArray(row) ? row[0] : row[key]));

const appliedMigrations = async (queryInterface) => {
  const rows = await queryInterface.sequelize.query(
    `SELECT "name" FROM "${META_TABLE}" ORDER BY "name"`,
    { type: Sequelize.QueryTypes.SELECT }
  );
  return columnValues(rows, 'name');
};

/**
 * Bekleyen migration'ları koşar. Zaten uygulanmışsa hiçbir şey yapmaz (idempotent).
 * @returns {Promise<{pending: number, applied: number, total: number, ran: string[]}>}
 */
const runMigrations = async (sequelize, { log = () => {} } = {}) => {
  const queryInterface = sequelize.getQueryInterface();
  await ensureMetaTable(queryInterface);

  const all = listMigrationFiles();
  const knownFiles = new Set(all);
  const appliedSet = new Set(await appliedMigrations(queryInterface));

  // Silinmiş/yeniden adlandırılmış migration dosyalarının `SequelizeMeta` kaydı kalırsa
  // sayaç yanlış rapor verir ("18/17") ve ileride kafa karıştırır: öksüz kayıtları temizle.
  const orphans = [...appliedSet].filter((name) => !knownFiles.has(name));
  if (orphans.length > 0) {
    await queryInterface.bulkDelete(META_TABLE, { name: { [Sequelize.Op.in]: orphans } });
    orphans.forEach((name) => appliedSet.delete(name));
    log(`  ⨯ öksüz migration kaydı silindi: ${orphans.join(', ')}`);
  }

  const pending = all.filter((file) => !appliedSet.has(file));

  for (const file of pending) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const migration = require(path.join(MIGRATIONS_DIR, file));
    if (typeof migration.up !== 'function') {
      throw new Error(`Migration ${file}: up() fonksiyonu yok`);
    }
    await migration.up(queryInterface, Sequelize);
    await queryInterface.bulkInsert(META_TABLE, [{ name: file }]);
    log(`  ↑ ${file}`);
  }

  return {
    pending: pending.length,
    applied: appliedSet.size + pending.length,
    total: all.length,
    ran: pending,
  };
};

/** `public` şemasındaki gerçek tablolar (SequelizeMeta hariç). */
const listDataTables = async (sequelize) => {
  const rows = await sequelize.query(
    `SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name`,
    { type: Sequelize.QueryTypes.SELECT }
  );
  return columnValues(rows, 'table_name').filter((name) => name !== META_TABLE);
};

const quoteIdentifier = (name) => `"${name.replace(/"/g, '""')}"`;

/**
 * Tüm veri tablolarını tek `TRUNCATE ... CASCADE` ile boşaltır.
 * Enum tipleri ve şema korunur → "type already exists" hatası oluşmaz.
 * @returns {Promise<number>} boşaltılan tablo sayısı
 */
const truncateAllTables = async (sequelize) => {
  const tables = await listDataTables(sequelize);
  if (tables.length === 0) return 0;
  await sequelize.query(
    `TRUNCATE TABLE ${tables.map(quoteIdentifier).join(', ')} RESTART IDENTITY CASCADE`
  );
  return tables.length;
};

/**
 * Test DB'sini hazırlar: bekleyen migration'ları koşar.
 * Idempotent — her test dosyası öncesi çağrılabilir.
 */
const ensureTestSchema = async (sequelize, options = {}) => runMigrations(sequelize, options);

module.exports = {
  MIGRATIONS_DIR,
  META_TABLE,
  listMigrationFiles,
  runMigrations,
  listDataTables,
  truncateAllTables,
  ensureTestSchema,
};
