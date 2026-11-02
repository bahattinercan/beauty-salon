'use strict';

/**
 * DB-001 P2 — §1.5 şema sürüklenmesi: model tanımlarında olup migration'larda
 * olmayan 11 kolonu ekler (geçmiş migration'lar değiştirilmez, üstüne biner).
 *
 *   salons             : price_range, pending_email, pending_phone,
 *                        phone_change_token, phone_change_token_expiry,
 *                        email_change_token, email_change_token_expiry   (7)
 *   users              : password_reset_token, password_reset_token_expiry (2)
 *   service_categories : description, is_active                          (2)
 *
 * Idempotent: her kolon `describeTable` ile kontrol edilir; kısmen uygulanmış
 * şemada tekrar çalıştırmak hata vermez.
 */

const addMissing = async (queryInterface, tableName, columns) => {
  const existing = await queryInterface.describeTable(tableName);

  for (const [name, definition] of Object.entries(columns)) {
    if (existing[name]) continue;
    await queryInterface.addColumn(tableName, name, definition);
  }
};

const removeExisting = async (queryInterface, tableName, columnNames) => {
  const existing = await queryInterface.describeTable(tableName);

  for (const name of columnNames) {
    if (!existing[name]) continue;
    await queryInterface.removeColumn(tableName, name);
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    await addMissing(queryInterface, 'salons', {
      price_range: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 2,
      },
      pending_email: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      pending_phone: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      phone_change_token: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      phone_change_token_expiry: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      email_change_token: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      email_change_token_expiry: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await addMissing(queryInterface, 'users', {
      password_reset_token: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      password_reset_token_expiry: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await addMissing(queryInterface, 'service_categories', {
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    });
  },

  async down(queryInterface) {
    await removeExisting(queryInterface, 'service_categories', ['is_active', 'description']);
    await removeExisting(queryInterface, 'users', [
      'password_reset_token_expiry',
      'password_reset_token',
    ]);
    await removeExisting(queryInterface, 'salons', [
      'email_change_token_expiry',
      'email_change_token',
      'phone_change_token_expiry',
      'phone_change_token',
      'pending_phone',
      'pending_email',
      'price_range',
    ]);
  },
};
