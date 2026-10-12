'use strict';

/**
 * favorites tablosunda "her kolon ayrı primaryKey" hatası düzeltiliyor.
 * Eski şema: user_id PRIMARY KEY, salon_id PRIMARY KEY
 *   -> SQLite her kolonu tek başına unique yapıyor; bir kullanıcı yalnızca
 *      tek bir salonu favorileyebiliyordu.
 * Yeni şema: id (UUID) PK + (user_id, salon_id) unique index.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.getTable('favorites');
    if (!table) return;

    const cols = await queryInterface.describeTable('favorites');
    if (cols.id) return; // zaten düzeltilmiş

    await queryInterface.createTable('favorites_new', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
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
        defaultValue: Sequelize.now ? Sequelize.now() : new Date(),
      },
    });

    await queryInterface.addIndex('favorites_new', ['user_id', 'salon_id'], {
      unique: true,
      name: 'favorites_user_id_salon_id_unique',
    });

    await queryInterface.execute(
      'INSERT INTO favorites_new (id, user_id, salon_id, created_at) ' +
      'SELECT (SELECT hex(randomblob(16))), user_id, salon_id, created_at FROM favorites'
    );

    await queryInterface.dropTable('favorites');
    await queryInterface.renameTable('favorites_new', 'favorites');
  },

  async down(queryInterface, Sequelize) {
    const cols = await queryInterface.describeTable('favorites');
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

    await queryInterface.execute(
      'INSERT INTO favorites_old (user_id, salon_id, created_at) ' +
      'SELECT user_id, salon_id, created_at FROM favorites'
    );

    await queryInterface.dropTable('favorites');
    await queryInterface.renameTable('favorites_old', 'favorites');
  },
};
