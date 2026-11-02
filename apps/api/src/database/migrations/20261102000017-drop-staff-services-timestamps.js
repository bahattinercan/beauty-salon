'use strict';

/**
 * DB-001 P3 — `staff_services.created_at` / `updated_at` kolon uyumsuzluğu.
 *
 * Sorun: `20240101000006-create-staff-services.js` join tablosuna `created_at`/`updated_at`
 * kolonlarını **NOT NULL ve DEFAULT'suz** ekliyor; model (`src/models/StaffService.js:20`)
 * ise `timestamps: false`. Sequelize INSERT'te bu kolonları hiç yazmadığı için Postgres'te
 * her seed `23502 null value in column "created_at" violates not-null constraint` alıyordu.
 *
 * Karar: **kolonları DROP et** (DEFAULT eklemek değil).
 * Gerekçe:
 *  1. Model tek doğru kaynak: `timestamps: false` → tablo timestamp taşımıyor. Kolonu
 *     DEFAULT now() ile bırakmak, hiçbir kodun okumadığı/güncellemediği "ölü" bir kolon
 *     bırakırdı (§1.5'teki şema sürüklenmesinin aynısı); `updated_at` her zaman INSERT
 *     anında donar, yani yanıltıcı veri üretir.
 *  2. SQLite tarafında (sync + `timestamps: false`) bu kolonlar **hiç oluşmadı**; DROP,
 *     iki dialectin şemasını modelde birleştirir.
 *  3. Join tablosunda satır = ilişkinin varlığı; audit zamanı gerektiren tek bir okuma
 *     yok (`grep staff_services` → yalnız model/migration; `StaffService` kullanımları
 *     `findAll/destroy/bulkCreate/create`).
 *  4. DROP, veri kaybı değil: kolonlar bugüne kadar hiçbir INSERT'te dolmadı (PG'de 0 satır).
 *
 * Idempotent: kolon yoksa atlar. Dialect bağımsız; SQLite'ta kolonlar zaten olmadığı için
 * up() no-op olur.
 *
 * Geri alma (`db:migrate:undo`): kolonları **DEFAULT now() ile NOT NULL** olarak geri ekler.
 * Orijinal tanım DEFAULT'suzdu; dolu bir tabloya DEFAULT'suz NOT NULL kolon eklemek
 * imkânsız olduğu için en yakın geri dönüş budur (davranış farkı yok: seed yine bu kolonları
 * yazmaz, DB doldurur).
 */

const TIMESTAMP_COLUMNS = ['created_at', 'updated_at'];

module.exports = {
  async up(queryInterface) {
    const columns = await queryInterface.describeTable('staff_services');

    for (const name of TIMESTAMP_COLUMNS) {
      if (!columns[name]) continue;
      await queryInterface.removeColumn('staff_services', name);
    }
  },

  async down(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('staff_services');

    for (const name of TIMESTAMP_COLUMNS) {
      if (columns[name]) continue;
      await queryInterface.addColumn('staff_services', name, {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now'),
      });
    }
  },
};
