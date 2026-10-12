const { User, Salon, Staff, ServiceCategory, Service, StaffService, Appointment, Review } = require('../models');

const seed = async () => {
  try {
    console.log('Seed başlatılıyor...');

    // ── Kullanıcılar ──────────────────────────────────────────────────────────
    let admin = await User.findOne({ where: { email: 'admin@beautysalon.com' } });
    if (!admin) {
      admin = await User.create({
        email: 'admin@beautysalon.com',
        passwordHash: 'Admin123!',
        fullName: 'Platform Admin',
        role: 'ADMIN',
        isVerified: true,
      });
    }

    let owner = await User.findOne({ where: { email: 'salon@beautysalon.com' } });
    if (!owner) {
      owner = await User.create({
        email: 'salon@beautysalon.com',
        passwordHash: 'Salon123!',
        fullName: 'Ayşe Yılmaz',
        phone: '+905321234567',
        role: 'SALON_OWNER',
        isVerified: true,
      });
    }

    let owner2 = await User.findOne({ where: { email: 'salon2@beautysalon.com' } });
    if (!owner2) {
      owner2 = await User.create({
        email: 'salon2@beautysalon.com',
        passwordHash: 'Salon123!',
        fullName: 'Fatma Demir',
        phone: '+905337654321',
        role: 'SALON_OWNER',
        isVerified: true,
      });
    }

    let customer = await User.findOne({ where: { email: 'musteri@beautysalon.com' } });
    if (!customer) {
      customer = await User.create({
        email: 'musteri@beautysalon.com',
        passwordHash: 'Musteri123!',
        fullName: 'Zeynep Kaya',
        phone: '+905339876543',
        role: 'CUSTOMER',
        isVerified: true,
      });
    }

    // ── Kategoriler ───────────────────────────────────────────────────────────
    const existingCats = await ServiceCategory.count();
    let categories;
    if (existingCats === 0) {
      categories = await ServiceCategory.bulkCreate([
        { name: 'Saç', iconName: 'content_cut', sortOrder: 1 },
        { name: 'Tırnak', iconName: 'brush', sortOrder: 2 },
        { name: 'Cilt Bakımı', iconName: 'face', sortOrder: 3 },
        { name: 'Makyaj', iconName: 'palette', sortOrder: 4 },
        { name: 'Epilasyon', iconName: 'spa', sortOrder: 5 },
        { name: 'SPA & Masaj', iconName: 'self_improvement', sortOrder: 6 },
      ]);
    } else {
      categories = await ServiceCategory.findAll({ order: [['sortOrder', 'ASC']] });
    }
    const [catSac, catTirnak, catCilt, catMakyaj] = categories;

    // ── Salonlar ─────────────────────────────────────────────────────────────
    const existingSalons = await Salon.count();
    if (existingSalons > 0) {
      console.log('Salonlar zaten mevcut, salon seed atlanıyor.');
      console.log('Admin: admin@beautysalon.com / Admin123!');
      console.log('Salon Sahibi: salon@beautysalon.com / Salon123!');
      console.log('Müşteri: musteri@beautysalon.com / Musteri123!');
      return;
    }

    const salonData = [
      {
        ownerId: owner.id, name: 'Elegance Beauty Studio', priceRange: 3,
        description: 'İstanbul\'un kalbinde, profesyonel ekibimizle güzelliğinize değer katıyoruz.',
        phone: '+902161234567', email: 'info@elegancebeauty.com',
        address: 'Bağdat Cad. No:123, Kadıköy', latitude: 40.9833, longitude: 29.0500,
        city: 'İstanbul', district: 'Kadıköy', ratingAvg: 0, reviewCount: 0,
        isActive: true, isVerified: true,
        workingHours: { monday: { open: '09:00', close: '21:00' }, tuesday: { open: '09:00', close: '21:00' }, wednesday: { open: '09:00', close: '21:00' }, thursday: { open: '09:00', close: '21:00' }, friday: { open: '09:00', close: '21:00' }, saturday: { open: '10:00', close: '20:00' }, sunday: { open: '10:00', close: '18:00' } },
      },
      {
        ownerId: owner.id, name: 'Rose Gold Beauty Center', priceRange: 3,
        description: 'Lüks ve konforlu ortamda profesyonel güzellik hizmetleri.',
        phone: '+902167654321', email: 'info@rosegold.com',
        address: 'Abdi İpekçi Cad. No:45, Nişantaşı', latitude: 41.0480, longitude: 28.9950,
        city: 'İstanbul', district: 'Şişli', ratingAvg: 4.7, reviewCount: 189,
        isActive: true, isVerified: true,
        workingHours: { monday: { open: '10:00', close: '20:00' }, tuesday: { open: '10:00', close: '20:00' }, wednesday: { open: '10:00', close: '20:00' }, thursday: { open: '10:00', close: '20:00' }, friday: { open: '10:00', close: '20:00' }, saturday: { open: '10:00', close: '19:00' } },
      },
      {
        ownerId: owner2.id, name: 'Bella Güzellik Merkezi', priceRange: 2,
        description: 'Tırnak ve cilt bakımında İstanbul\'un en iyi uzmanları.',
        phone: '+902123456789', email: 'info@bellabeauty.com',
        address: 'Barbaros Bulvarı No:78, Beşiktaş', latitude: 41.0422, longitude: 29.0066,
        city: 'İstanbul', district: 'Beşiktaş', ratingAvg: 4.8, reviewCount: 312,
        isActive: true, isVerified: true,
        workingHours: { monday: { open: '09:00', close: '20:00' }, tuesday: { open: '09:00', close: '20:00' }, wednesday: { open: '09:00', close: '20:00' }, thursday: { open: '09:00', close: '20:00' }, friday: { open: '09:00', close: '20:00' }, saturday: { open: '09:00', close: '18:00' } },
      },
      {
        ownerId: owner2.id, name: 'Diamond SPA & Beauty', priceRange: 3,
        description: 'Şehrin yorgunluğunu atmak için huzurlu SPA ve masaj deneyimi.',
        phone: '+902122345678', email: 'info@diamondspa.com',
        address: 'Halaskargazi Cad. No:234, Şişli', latitude: 41.0519, longitude: 28.9850,
        city: 'İstanbul', district: 'Şişli', ratingAvg: 4.6, reviewCount: 145,
        isActive: true, isVerified: true,
        workingHours: { monday: { open: '10:00', close: '21:00' }, tuesday: { open: '10:00', close: '21:00' }, wednesday: { open: '10:00', close: '21:00' }, thursday: { open: '10:00', close: '21:00' }, friday: { open: '10:00', close: '21:00' }, saturday: { open: '10:00', close: '21:00' }, sunday: { open: '11:00', close: '20:00' } },
      },
      {
        ownerId: owner.id, name: 'Glam Nail Studio', priceRange: 2,
        description: 'Tırnak sanatında sınırları zorlayan yaratıcı tasarımlar.',
        phone: '+902124567890', email: 'info@glamnail.com',
        address: 'İstasyon Cad. No:12, Bakırköy', latitude: 40.9803, longitude: 28.8773,
        city: 'İstanbul', district: 'Bakırköy', ratingAvg: 4.5, reviewCount: 98,
        isActive: true, isVerified: true,
        workingHours: { monday: { open: '10:00', close: '19:00' }, tuesday: { open: '10:00', close: '19:00' }, wednesday: { open: '10:00', close: '19:00' }, thursday: { open: '10:00', close: '19:00' }, friday: { open: '10:00', close: '19:00' }, saturday: { open: '10:00', close: '18:00' } },
      },
      {
        ownerId: owner2.id, name: 'Velvet Beauty Center', priceRange: 2,
        description: 'Makyaj ve cilt bakımında profesyonel dokunuş.',
        phone: '+902163456789', email: 'info@velvetbeauty.com',
        address: 'Atatürk Cad. No:56, Ataşehir', latitude: 40.9854, longitude: 29.1128,
        city: 'İstanbul', district: 'Ataşehir', ratingAvg: 4.7, reviewCount: 167,
        isActive: true, isVerified: true,
        workingHours: { monday: { open: '09:30', close: '20:30' }, tuesday: { open: '09:30', close: '20:30' }, wednesday: { open: '09:30', close: '20:30' }, thursday: { open: '09:30', close: '20:30' }, friday: { open: '09:30', close: '20:30' }, saturday: { open: '10:00', close: '19:00' } },
      },
      {
        ownerId: owner.id, name: 'Smooth Wax Center', priceRange: 1,
        description: 'Ağda ve epilasyon konusunda İstanbul\'un lider merkezi.',
        phone: '+902164567890', email: 'info@smoothwax.com',
        address: 'Büyük Hamam Sok. No:8, Üsküdar', latitude: 41.0255, longitude: 29.0154,
        city: 'İstanbul', district: 'Üsküdar', ratingAvg: 4.4, reviewCount: 82,
        isActive: true, isVerified: true,
        workingHours: { monday: { open: '09:00', close: '19:00' }, tuesday: { open: '09:00', close: '19:00' }, wednesday: { open: '09:00', close: '19:00' }, thursday: { open: '09:00', close: '19:00' }, friday: { open: '09:00', close: '19:00' }, saturday: { open: '10:00', close: '17:00' } },
      },
      {
        ownerId: owner2.id, name: 'Zen SPA & Masaj', priceRange: 3,
        description: 'Doğa ile bütünleşen, ruh ve beden dinginliği sunan premium SPA.',
        phone: '+902122876543', email: 'info@zenspa.com',
        address: 'Maslak Mah. No:102, Sarıyer', latitude: 41.1127, longitude: 29.0132,
        city: 'İstanbul', district: 'Sarıyer', ratingAvg: 4.9, reviewCount: 276,
        isActive: true, isVerified: true,
        workingHours: { monday: { open: '08:00', close: '22:00' }, tuesday: { open: '08:00', close: '22:00' }, wednesday: { open: '08:00', close: '22:00' }, thursday: { open: '08:00', close: '22:00' }, friday: { open: '08:00', close: '22:00' }, saturday: { open: '09:00', close: '22:00' }, sunday: { open: '09:00', close: '21:00' } },
      },
      {
        ownerId: owner.id, name: 'Glamour Hair Studio', priceRange: 2,
        description: 'Saç tasarımında yenilikçi teknikler ve modern trendler.',
        phone: '+902165678901', email: 'info@glamourhair.com',
        address: 'Bağlarbaşı Cad. No:34, Maltepe', latitude: 40.9358, longitude: 29.1258,
        city: 'İstanbul', district: 'Maltepe', ratingAvg: 4.3, reviewCount: 73,
        isActive: true, isVerified: true,
        workingHours: { monday: { open: '09:00', close: '20:00' }, tuesday: { open: '09:00', close: '20:00' }, wednesday: { open: '09:00', close: '20:00' }, thursday: { open: '09:00', close: '20:00' }, friday: { open: '09:00', close: '20:00' }, saturday: { open: '09:00', close: '18:00' } },
      },
      {
        ownerId: owner2.id, name: 'Petal Beauty & Nail', priceRange: 1,
        description: 'El ve ayak bakımında özenli hizmet, sevimli tasarımlar.',
        phone: '+902166789012', email: 'info@petalbeauty.com',
        address: 'Pendik Mah. No:67, Pendik', latitude: 40.8739, longitude: 29.2340,
        city: 'İstanbul', district: 'Pendik', ratingAvg: 4.6, reviewCount: 134,
        isActive: true, isVerified: true,
        workingHours: { monday: { open: '09:00', close: '19:30' }, tuesday: { open: '09:00', close: '19:30' }, wednesday: { open: '09:00', close: '19:30' }, thursday: { open: '09:00', close: '19:30' }, friday: { open: '09:00', close: '19:30' }, saturday: { open: '10:00', close: '18:00' } },
      },
      {
        ownerId: owner.id, name: 'Luxe Güzellik & SPA', priceRange: 3,
        description: 'Makyaj, cilt bakımı ve SPA hizmetlerini tek çatı altında sunuyoruz.',
        phone: '+902127890123', email: 'info@luxebeauty.com',
        address: 'Kavacık Mah. No:45, Beykoz', latitude: 41.1067, longitude: 29.0811,
        city: 'İstanbul', district: 'Beykoz', ratingAvg: 4.8, reviewCount: 201,
        isActive: true, isVerified: true,
        workingHours: { monday: { open: '10:00', close: '21:00' }, tuesday: { open: '10:00', close: '21:00' }, wednesday: { open: '10:00', close: '21:00' }, thursday: { open: '10:00', close: '21:00' }, friday: { open: '10:00', close: '21:00' }, saturday: { open: '10:00', close: '20:00' }, sunday: { open: '11:00', close: '19:00' } },
      },
      {
        ownerId: owner2.id, name: 'Blossom Kuaför & Epilasyon', priceRange: 1,
        description: 'Saç ve epilasyon hizmetlerinde uygun fiyat, kaliteli hizmet.',
        phone: '+902128901234', email: 'info@blossom.com',
        address: 'Gazi Cad. No:23, Sultangazi', latitude: 41.1058, longitude: 28.8817,
        city: 'İstanbul', district: 'Sultangazi', ratingAvg: 4.2, reviewCount: 56,
        isActive: true, isVerified: true,
        workingHours: { monday: { open: '08:30', close: '19:30' }, tuesday: { open: '08:30', close: '19:30' }, wednesday: { open: '08:30', close: '19:30' }, thursday: { open: '08:30', close: '19:30' }, friday: { open: '08:30', close: '19:30' }, saturday: { open: '09:00', close: '18:00' } },
      },
    ];

    const salons = await Salon.bulkCreate(salonData);

    // ── Çalışanlar & Hizmetler (ilk salon için) ───────────────────────────────
    const [salon1] = salons;

    const staff1 = await Staff.create({ salonId: salon1.id, fullName: 'Merve Demir', title: 'Kıdemli Kuaför', bio: '10 yıllık tecrübe ile saç tasarımı uzmanı' });
    const staff2 = await Staff.create({ salonId: salon1.id, fullName: 'Selin Arslan', title: 'Güzellik Uzmanı', bio: 'Cilt bakımı ve makyaj konusunda uzman' });
    const staff3 = await Staff.create({ salonId: salon1.id, fullName: 'Elif Öztürk', title: 'Tırnak Tasarımcısı', bio: 'Nail art ve protez tırnak uzmanı' });

    const sacKesim = await Service.create({ salonId: salon1.id, categoryId: catSac.id, name: 'Saç Kesimi', description: 'Profesyonel saç kesimi ve şekillendirme', price: 250, durationMinutes: 45 });
    const sacBoya = await Service.create({ salonId: salon1.id, categoryId: catSac.id, name: 'Saç Boyama', description: 'Kök boya veya komple boya uygulaması', price: 500, durationMinutes: 120 });
    const ombre = await Service.create({ salonId: salon1.id, categoryId: catSac.id, name: 'Ombre / Balyaj', description: 'Modern renk geçişli saç boyama', price: 1200, durationMinutes: 180 });
    const manikur = await Service.create({ salonId: salon1.id, categoryId: catTirnak.id, name: 'Manikür', description: 'El bakımı ve oje uygulaması', price: 150, durationMinutes: 45 });
    const pedikur = await Service.create({ salonId: salon1.id, categoryId: catTirnak.id, name: 'Pedikür', description: 'Ayak bakımı ve oje uygulaması', price: 200, durationMinutes: 60 });
    const ciltBakimi = await Service.create({ salonId: salon1.id, categoryId: catCilt.id, name: 'Cilt Bakımı', description: 'Derin temizlik ve nemlendirme', price: 400, durationMinutes: 60 });
    const makyaj = await Service.create({ salonId: salon1.id, categoryId: catMakyaj.id, name: 'Profesyonel Makyaj', description: 'Özel gün veya günlük makyaj', price: 350, durationMinutes: 60 });

    await StaffService.bulkCreate([
      { staffId: staff1.id, serviceId: sacKesim.id },
      { staffId: staff1.id, serviceId: sacBoya.id },
      { staffId: staff1.id, serviceId: ombre.id },
      { staffId: staff2.id, serviceId: ciltBakimi.id },
      { staffId: staff2.id, serviceId: makyaj.id },
      { staffId: staff3.id, serviceId: manikur.id },
      { staffId: staff3.id, serviceId: pedikur.id },
    ]);

    // ── Tamamlanmış randevular & yorumlar (salon1 için) ───────────────────────
    const pastDate = (daysAgo) => {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      return d.toISOString().split('T')[0];
    };

    const reviewSeeds = [
      { staff: staff1, service: sacKesim,   daysAgo: 5,  startTime: '10:00:00', endTime: '10:45:00', rating: 5, comment: 'Harika bir deneyimdi! Merve Hanım çok ilgilendi, kesinlikle tavsiye ederim.', reply: null },
      { staff: staff1, service: sacBoya,    daysAgo: 14, startTime: '13:00:00', endTime: '15:00:00', rating: 4, comment: 'Saç boyam çok güzel çıktı, renk tam istediğim gibiydi.', reply: 'Teşekkürler, sizi tekrar görmekten memnuniyet duyarız! 💖' },
      { staff: staff2, service: ciltBakimi, daysAgo: 22, startTime: '11:00:00', endTime: '12:00:00', rating: 5, comment: 'Cilt bakımı sonrası yüzüm inanılmaz ferahladı. Selin Hanım çok profesyonel.', reply: null },
      { staff: staff3, service: manikur,    daysAgo: 35, startTime: '14:00:00', endTime: '14:45:00', rating: 4, comment: 'Manikür çok özenli yapıldı, tırnaklar mükemmel görünüyor.', reply: 'Güzel yorumunuz için teşekkürler! 🌸' },
      { staff: staff2, service: makyaj,     daysAgo: 50, startTime: '09:00:00', endTime: '10:00:00', rating: 5, comment: 'Nişan makyajım için geldim, herkes çok beğendi. Ellerine sağlık!', reply: 'Tebrikler! Mutlu günlerinizde yanınızda olmak çok güzeldi. ✨' },
    ];

    for (const item of reviewSeeds) {
      const appt = await Appointment.create({
        customerId: customer.id,
        salonId: salon1.id,
        staffId: item.staff.id,
        serviceId: item.service.id,
        date: pastDate(item.daysAgo),
        startTime: item.startTime,
        endTime: item.endTime,
        status: 'COMPLETED',
      });
      await Review.create({
        customerId: customer.id,
        salonId: salon1.id,
        appointmentId: appt.id,
        rating: item.rating,
        comment: item.comment,
        salonReply: item.reply,
        salonReplyAt: item.reply ? new Date() : null,
        isVisible: true,
      });
    }

    // Salon1 rating ortalamasını güncelle
    const totalRating = reviewSeeds.reduce((sum, r) => sum + r.rating, 0);
    await salon1.update({
      ratingAvg: Math.round((totalRating / reviewSeeds.length) * 10) / 10,
      reviewCount: reviewSeeds.length,
    });

    // İkinci salon hizmetleri
    const salon2 = salons[1];
    await Staff.create({ salonId: salon2.id, fullName: 'Ceren Yıldız', title: 'Saç Boyama Uzmanı', bio: 'Renk teorisi ve modern boya teknikleri uzmanı' });
    await Staff.create({ salonId: salon2.id, fullName: 'Büşra Çelik', title: 'Güzellik Uzmanı', bio: 'Makyaj ve cilt bakımı sertifikası' });
    await Service.create({ salonId: salon2.id, categoryId: catSac.id, name: 'Saç Kesimi & Fön', description: 'Kesim ve şekillendirme', price: 300, durationMinutes: 60 });
    await Service.create({ salonId: salon2.id, categoryId: catSac.id, name: 'Keratin Bakımı', description: 'Uzun ömürlü düzleştirme ve parlaklık', price: 800, durationMinutes: 150 });
    await Service.create({ salonId: salon2.id, categoryId: catMakyaj.id, name: 'Gelin Makyajı', description: 'Özel gün makyajı paketi', price: 1500, durationMinutes: 90 });
    await Service.create({ salonId: salon2.id, categoryId: catCilt.id, name: 'Anti-Aging Bakım', description: 'Yaşlanma karşıtı özel cilt bakımı', price: 650, durationMinutes: 75 });

    console.log('Seed tamamlandı! 12 salon oluşturuldu.');
    console.log('Admin: admin@beautysalon.com / Admin123!');
    console.log('Salon Sahibi: salon@beautysalon.com / Salon123!');
    console.log('Müşteri: musteri@beautysalon.com / Musteri123!');
  } catch (error) {
    console.error('Seed hatası:', error.message);
    throw error;
  }
};

module.exports = seed;
