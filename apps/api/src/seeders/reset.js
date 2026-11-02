// dotenv, `../config/database` yüklenmeden ÖNCE okunmalı: Sequelize örneği
// modül yüklenirken env'den (DB_DIALECT dahil) kuruluyor.
require('dotenv').config({ quiet: true });

const { sequelize } = require('../config/database');
const seed = require('./seed');

/*
 * Reset = "veriyi temizle + yeniden seed et". Şema migration'lardan gelir,
 * sync() yok (DB-001 P1/P3).
 *
 * Temizlik iki dalda:
 *  - postgres: tek `TRUNCATE TABLE ... RESTART IDENTITY CASCADE`. Tek ifade,
 *    FK sırası derdi yok, kısmi silme olmaz; boş tabloda da hata vermez.
 *    Sequence yok (UUID PK) ama RESTART IDENTITY ileride serial PK eklenirse
 *    sayacı da sıfırlar.
 *  - sqlite (geçici geri dönüş yolu, DB_DIALECT=sqlite): TRUNCATE yok → child-first
 *    sırada `DELETE FROM`.
 */

// FK sırası, çocuklar önce. Yalnız `DELETE` dalı için gerekli; TRUNCATE için referans.
const DATA_TABLES = [
  'reviews',
  'appointments',
  'staff_services',
  'favorites',
  'notifications',
  'products',
  'settings',
  'services',
  'staff',
  'salons',
  'service_categories',
  'users',
];

const quote = (name) => sequelize.getQueryInterface().quoteIdentifier(name);

// Tablo gerçekten varsa dokun (yarım kalmış şemada reset çökmemeli).
const existingTables = async () => {
  const tables = await sequelize.getQueryInterface().showAllTables();
  const names = tables.map((t) => (typeof t === 'string' ? t : t.tableName));
  return DATA_TABLES.filter((name) => names.includes(name));
};

const countRows = async (table) => {
  const [rows] = await sequelize.query(`SELECT COUNT(*) AS count FROM ${quote(table)}`);
  return Number(rows[0].count);
};

const truncatePostgres = async (tables) => {
  const list = tables.map(quote).join(', ');
  await sequelize.query(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
};

const deleteInOrder = async (tables) => {
  for (const table of tables) {
    await sequelize.query(`DELETE FROM ${quote(table)}`);
  }
};

const reset = async () => {
  const tables = await existingTables();
  const counts = {};
  for (const table of tables) {
    counts[table] = await countRows(table);
  }

  const dialect = sequelize.getDialect();
  console.log(`Veriler temizleniyor (${dialect})...`);

  if (dialect === 'postgres') {
    await truncatePostgres(tables);
  } else {
    await deleteInOrder(tables);
  }

  for (const table of tables) {
    if (counts[table] > 0) console.log(`  ${table}: ${counts[table]} kayıt silindi`);
  }

  await seed();
  console.log(`Reset tamamlandı (${dialect}).`);
};

module.exports = reset;

if (require.main === module) {
  (async () => {
    try {
      console.log(`DB dialect: ${sequelize.getDialect()}`);
      await reset();
    } catch (error) {
      console.error('Reset seed hatası:', error.message);
      process.exitCode = 1;
    } finally {
      await sequelize.close();
    }
  })();
}
