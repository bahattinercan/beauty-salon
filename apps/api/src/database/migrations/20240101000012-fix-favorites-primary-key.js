'use strict';

const crypto = require('crypto');

/**
 * favorites tablosunda "her kolon ayrı primaryKey" hatası düzeltiliyor.
 * Eski şema: user_id PRIMARY KEY, salon_id PRIMARY KEY
 *   -> SQLite her kolonu tek başına unique yapıyor; bir kullanıcı yalnızca
 *      tek bir salonu favorileyebiliyordu.
 * Yeni şema: id (UUID) PK + (user_id, salon_id) unique index.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    let cols;
    try {
      cols = await queryInterface.describeTable('favorites');
    } catch {
      return;
    }
    if (cols.id) return; // zaten düzeltilmiş

    await queryInterface.createTable('favorites_new', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      salon_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'salons', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('favorites_new', ['user_id', 'salon_id'], {
      unique: true,
      name: 'favorites_user_id_salon_id_unique',
    });

    const [rows] = await queryInterface.sequelize.query(
      'SELECT user_id, salon_id, created_at FROM favorites'
    );

    if (rows.length > 0) {
      await queryInterface.bulkInsert(
        'favorites_new',
        rows.map((row) => ({
          id: crypto.randomUUID(),
          user_id: row.user_id,
          salon_id: row.salon_id,
          created_at: row.created_at || new Date(),
        }))
      );
    }

    await queryInterface.dropTable('favorites');
    await queryInterface.renameTable('favorites_new', 'favorites');
  },

  async down(queryInterface, Sequelize) {
    let cols;
    try {
      cols = await queryInterface.describeTable('favorites');
    } catch {
      return;
    }
    if (!cols.id) return;

    await queryInterface.createTable('favorites_old', {
      user_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      salon_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        references: { model: 'salons', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    const [rows] = await queryInterface.sequelize.query(
      'SELECT user_id, salon_id, created_at FROM favorites'
    );

    if (rows.length > 0) {
      await queryInterface.bulkInsert(
        'favorites_old',
        rows.map((row) => ({
          user_id: row.user_id,
          salon_id: row.salon_id,
          created_at: row.created_at || new Date(),
        }))
      );
    }

    await queryInterface.dropTable('favorites');
    await queryInterface.renameTable('favorites_old', 'favorites');
  },
};
