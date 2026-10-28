'use strict';

/**
 * service_categories tablosuna kategori medyası için iki nullable kolon ekler:
 *   image_url — kategori görseli (STRING)
 *   video_url — kategori tanıtım videosu (TEXT)
 *
 * Idempotent: kolon zaten varsa atlanır, böylece kısmen uygulanmış şemada
 * tekrar çalıştırmak hata vermez.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const cols = await queryInterface.describeTable('service_categories');

    if (!cols.image_url) {
      await queryInterface.addColumn('service_categories', 'image_url', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    if (!cols.video_url) {
      await queryInterface.addColumn('service_categories', 'video_url', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const cols = await queryInterface.describeTable('service_categories');

    if (cols.video_url) {
      await queryInterface.removeColumn('service_categories', 'video_url');
    }

    if (cols.image_url) {
      await queryInterface.removeColumn('service_categories', 'image_url');
    }
  },
};
