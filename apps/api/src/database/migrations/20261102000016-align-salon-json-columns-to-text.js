'use strict';

/**
 * DB-001 P2 — `salons.gallery_images` / `salons.working_hours` tip kararı: **TEXT**.
 *
 * Gerekçe: tek doğru taraf model (`src/models/Salon.js`). Model bu iki alanı
 * `DataTypes.TEXT` olarak tanımlıyor ve JSON'a çevirme işini getter/setter'da yapıyor:
 *   - `gallery_images`: TEXT, default `'[]'`, getter `JSON.parse` + setter `JSON.stringify`
 *   - `working_hours` : TEXT, default `'{}'`, getter çift-stringify kaydını da tolere ediyor
 * Migration (`20240101000003-create-salons.js`) ise JSONB yazıyordu. JSONB'ye çekmek
 * modeli + seeder'ı + 357 SQLite testini aynı anda değiştirmek demek; ayrıca Sequelize
 * `JSONB` SQLite lehçesinde karşılıksız olduğu için testler (P4 öncesi hâlâ SQLite)
 * kırılırdı. Bu yüzden kolonlar TEXT'e indirilir: model kodu, seeder ve testler
 * değişmez, iki taraf ayrık kalmaz.
 *
 * Yalnız PostgreSQL'de çalışır (SQLite'ta bu tipler zaten TEXT).
 * Idempotent: kolon tipi zaten TEXT ise atlar.
 */

const isPostgres = (queryInterface) =>
  queryInterface.sequelize.getDialect() === 'postgres';

const columnType = (columns, name) =>
  String((columns[name] && columns[name].type) || '').toUpperCase();

module.exports = {
  async up(queryInterface) {
    if (!isPostgres(queryInterface)) return;

    const columns = await queryInterface.describeTable('salons');

    if (columnType(columns, 'gallery_images').includes('JSON')) {
      await queryInterface.sequelize.query(
        'ALTER TABLE "salons" ALTER COLUMN "gallery_images" DROP DEFAULT'
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "salons" ALTER COLUMN "gallery_images" TYPE TEXT USING "gallery_images"::text'
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "salons" ALTER COLUMN "gallery_images" SET DEFAULT '[]'`
      );
    }

    if (columnType(columns, 'working_hours').includes('JSON')) {
      await queryInterface.sequelize.query(
        'ALTER TABLE "salons" ALTER COLUMN "working_hours" DROP DEFAULT'
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE "salons" ALTER COLUMN "working_hours" TYPE TEXT USING "working_hours"::text'
      );
    }
  },

  async down(queryInterface) {
    if (!isPostgres(queryInterface)) return;

    const columns = await queryInterface.describeTable('salons');

    if (columnType(columns, 'gallery_images') === 'TEXT') {
      await queryInterface.sequelize.query(
        'ALTER TABLE "salons" ALTER COLUMN "gallery_images" DROP DEFAULT'
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "salons" ALTER COLUMN "gallery_images" TYPE JSONB USING
           CASE WHEN "gallery_images" IS NULL OR btrim("gallery_images") = ''
                THEN '[]'::jsonb ELSE "gallery_images"::jsonb END`
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "salons" ALTER COLUMN "gallery_images" SET DEFAULT '[]'::jsonb`
      );
    }

    if (columnType(columns, 'working_hours') === 'TEXT') {
      await queryInterface.sequelize.query(
        'ALTER TABLE "salons" ALTER COLUMN "working_hours" DROP DEFAULT'
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "salons" ALTER COLUMN "working_hours" TYPE JSONB USING
           CASE WHEN "working_hours" IS NULL OR btrim("working_hours") = ''
                THEN NULL ELSE "working_hours"::jsonb END`
      );
    }
  },
};
