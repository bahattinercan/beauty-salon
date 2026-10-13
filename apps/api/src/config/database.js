const { Sequelize } = require('sequelize');
const path = require('path');

// Use test database when in test environment
const dbStorage = process.env.NODE_ENV === 'test'
  ? path.join(__dirname, '..', 'test-database.sqlite')
  : path.join(__dirname, '..', 'database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbStorage,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    underscored: true,
    timestamps: true,
  },
});

/**
 * SQLite'ta `sync({ alter: true })` tabloyu yeniden oluşturarak kolon
 * değiştirir; foreign key'ler varsa bu işlem FK constraint hatası verir
 * (ve `*_backup` gibi yetim tablolar bırakır).
 *
 * Bunun yerine eksik kolonları doğrudan `ALTER TABLE ... ADD COLUMN` ile
 * ekliyoruz — SQLite bunu tabloyu yeniden oluşturmadan, güvenli şekilde yapar.
 */
const ensureColumns = async () => {
  if (sequelize.dialect.name !== 'sqlite') return [];

  const models = require('../models');
  const added = [];

  for (const model of Object.values(models)) {
    const table = model.tableName;
    const info = await sequelize.query(`PRAGMA table_info(\`${table}\`)`);
    const existing = new Set(info[0].map((col) => col.name));

    for (const attr of Object.values(model.rawAttributes)) {
      const column = attr.field || attr.name;
      if (existing.has(column)) continue;

      let sql = `\`${column}\` ${attr.type.toSql()}`;
      if (attr.defaultValue !== undefined) {
        sql += ` DEFAULT ${sequelize.escape(attr.defaultValue)}`;
      }

      await sequelize.query(`ALTER TABLE \`${table}\` ADD COLUMN ${sql}`);
      added.push(`${table}.${column}`);
    }
  }

  return added;
};

/**
 * Başarısız alter denemelerinden kalan `*_backup` tablolarını temizler.
 */
const dropBackupTables = async () => {
  if (sequelize.dialect.name !== 'sqlite') return [];

  const tables = await sequelize.query(
    "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%_backup'"
  );
  const dropped = [];

  for (const t of tables[0]) {
    await sequelize.query(`DROP TABLE \`${t.name}\``);
    dropped.push(t.name);
  }

  return dropped;
};

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('SQLite bağlantısı başarılı');
  } catch (error) {
    console.error('Veritabanı bağlantı hatası:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB, ensureColumns, dropBackupTables };
