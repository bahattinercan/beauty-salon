const { sequelize, dropBackupTables } = require('../config/database');
const models = require('../models');
const seed = require('./seed');

// FK sırasına göre: çocuklar önce
const TRUNCATE_ORDER = [
  'Review',
  'Appointment',
  'StaffService',
  'Favorite',
  'Notification',
  'Product',
  'Setting',
  'Service',
  'Staff',
  'Salon',
  'ServiceCategory',
  'User',
];

const reset = async () => {
  await sequelize.sync();
  await dropBackupTables();

  console.log('Veriler temizleniyor...');
  for (const name of TRUNCATE_ORDER) {
    const Model = models[name];
    if (!Model) continue;
    const count = await Model.count();
    if (count > 0) {
      await Model.destroy({ where: {} });
      console.log(`  ${name}: ${count} kayıt silindi`);
    }
  }

  await seed();
};

module.exports = reset;

if (require.main === module) {
  require('dotenv').config();
  reset().catch((error) => {
    console.error('Reset seed hatası:', error.message);
    process.exit(1);
  });
}
