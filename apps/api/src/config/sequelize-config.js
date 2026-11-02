require('dotenv').config();

const { buildSequelizeOptions } = require('./database');

// sequelize-cli aynı connection factory'yi kullanır; runtime ile CLI arasında
// ayrı config kopyası yok. CLI environment adları (development/test/production) korunur.
module.exports = {
  development: buildSequelizeOptions('development'),
  test: buildSequelizeOptions('test'),
  production: buildSequelizeOptions('production'),
};
