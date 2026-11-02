'use strict';

/**
 * DB-001 P2 — `settings` tablosu (admin panel anahtar/değer ayarları).
 *
 * Şimdiye kadar yalnız `src/models/Setting.js` vardı; migration'ı yoktu, bu yüzden
 * PostgreSQL şemasında tablo hiç oluşmuyordu (§1.5). Kolonlar model ile birebir:
 *   key        STRING, primary key (model: primaryKey, zorunlu)
 *   value      JSONB (model: DataTypes.JSON; sequelize her iki tipte de nesne döner,
 *              jsonb sorgulanabilirlik için seçildi)
 *   created_at TIMESTAMPTZ (model `timestamps: true, updatedAt: false` → yalnız created_at)
 *
 * Idempotent: tablo zaten varsa up() atlar, yoksa down() atlar.
 */

const hasTable = async (queryInterface, tableName) => {
  const tables = await queryInterface.showAllTables();
  return tables.map((t) => (typeof t === 'string' ? t : t.tableName)).includes(tableName);
};

module.exports = {
  async up(queryInterface, Sequelize) {
    if (await hasTable(queryInterface, 'settings')) return;

    await queryInterface.createTable('settings', {
      key: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      value: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    if (!(await hasTable(queryInterface, 'settings'))) return;

    await queryInterface.dropTable('settings');
  },
};
