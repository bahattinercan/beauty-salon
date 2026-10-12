require('dotenv').config();

const app = require('./app');
const { sequelize, connectDB } = require('./config/database');
const seed = require('./seeders/seed');

const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    // Veritabanı bağlantısı
    await connectDB();

    // SQLite için tabloları sync ile oluştur (alter: false → sadece eksik tablolar oluşturulur)
    await sequelize.sync({ alter: true });

    // Seed kontrolü - kullanıcı veya salon yoksa seed çalıştır
    const { User, Salon } = require('./models');
    const [userCount, salonCount] = await Promise.all([User.count(), Salon.count()]);
    if (userCount === 0 || salonCount === 0) {
      console.log('Seed verileri oluşturuluyor...');
      await seed();
    }

    // Sunucuyu başlat
    app.listen(PORT, () => {
      console.log(`\n🚀 Beauty Salon API çalışıyor`);
      console.log(`   URL: http://localhost:${PORT}${process.env.API_PREFIX || '/api/v1'}`);
      console.log(`   Health: http://localhost:${PORT}${process.env.API_PREFIX || '/api/v1'}/health`);
      console.log(`   Ortam: ${process.env.NODE_ENV}\n`);
    });
  } catch (error) {
    console.error('Sunucu başlatma hatası:', error);
    process.exit(1);
  }
};

start();
