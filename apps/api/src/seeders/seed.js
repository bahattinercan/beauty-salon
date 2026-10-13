const {
  User,
  Salon,
  Staff,
  ServiceCategory,
  Service,
  StaffService,
  Appointment,
  Review,
} = require('../models');

/*
 * İdempotent seed: her kayıt "var mı, yoksa oluştur" mantığıyla eklenir.
 * Seed birden fazla kez çalıştırılabilir; ayrıca eski/eksik verileri
 * (ör. category_id NULL olan hizmetler) onarır.
 */

const USERS = [
  { email: 'admin@beautysalon.com', phone: null, fullName: 'Platform Admin', role: 'ADMIN' },
  { email: 'salon@beautysalon.com', phone: '+905321234567', fullName: 'Ayşe Yılmaz', role: 'SALON_OWNER' },
  { email: 'salon2@beautysalon.com', phone: '+905337654321', fullName: 'Fatma Demir', role: 'SALON_OWNER' },
  { email: 'musteri@beautysalon.com', phone: '+905339876543', fullName: 'Zeynep Kaya', role: 'CUSTOMER' },
];

const PASSWORDS = {
  'admin@beautysalon.com': 'Admin123!',
  'salon@beautysalon.com': 'Salon123!',
  'salon2@beautysalon.com': 'Salon123!',
  'musteri@beautysalon.com': 'Musteri123!',
};

const CATEGORIES = [
  { name: 'Saç', iconName: 'content_cut', sortOrder: 1 },
  { name: 'Tırnak', iconName: 'brush', sortOrder: 2 },
  { name: 'Cilt Bakımı', iconName: 'face', sortOrder: 3 },
  { name: 'Makyaj', iconName: 'palette', sortOrder: 4 },
  { name: 'Epilasyon', iconName: 'spa', sortOrder: 5 },
  { name: 'SPA & Masaj', iconName: 'self_improvement', sortOrder: 6 },
];

const SALONS = [
  {
    ownerEmail: 'salon@beautysalon.com', name: 'Elegance Beauty Studio', priceRange: 3,
    description: 'İstanbul\'un kalbinde, profesyonel ekibimizle güzelliğinize değer katıyoruz.',
    phone: '+902161234567', email: 'info@elegancebeauty.com',
    address: 'Bağdat Cad. No:123, Kadıköy', latitude: 40.9833, longitude: 29.0500,
    city: 'İstanbul', district: 'Kadıköy',
    workingHours: { monday: { open: '09:00', close: '21:00' }, tuesday: { open: '09:00', close: '21:00' }, wednesday: { open: '09:00', close: '21:00' }, thursday: { open: '09:00', close: '21:00' }, friday: { open: '09:00', close: '21:00' }, saturday: { open: '10:00', close: '20:00' }, sunday: { open: '10:00', close: '18:00' } },
  },
  {
    ownerEmail: 'salon@beautysalon.com', name: 'Rose Gold Beauty Center', priceRange: 3,
    description: 'Lüks ve konforlu ortamda profesyonel güzellik hizmetleri.',
    phone: '+902167654321', email: 'info@rosegold.com',
    address: 'Abdi İpekçi Cad. No:45, Nişantaşı', latitude: 41.0480, longitude: 28.9950,
    city: 'İstanbul', district: 'Şişli',
    workingHours: { monday: { open: '10:00', close: '20:00' }, tuesday: { open: '10:00', close: '20:00' }, wednesday: { open: '10:00', close: '20:00' }, thursday: { open: '10:00', close: '20:00' }, friday: { open: '10:00', close: '20:00' }, saturday: { open: '10:00', close: '19:00' } },
  },
  {
    ownerEmail: 'salon2@beautysalon.com', name: 'Bella Güzellik Merkezi', priceRange: 2,
    description: 'Tırnak ve cilt bakımında İstanbul\'un en iyi uzmanları.',
    phone: '+902123456789', email: 'info@bellabeauty.com',
    address: 'Barbaros Bulvarı No:78, Beşiktaş', latitude: 41.0422, longitude: 29.0066,
    city: 'İstanbul', district: 'Beşiktaş',
    workingHours: { monday: { open: '09:00', close: '20:00' }, tuesday: { open: '09:00', close: '20:00' }, wednesday: { open: '09:00', close: '20:00' }, thursday: { open: '09:00', close: '20:00' }, friday: { open: '09:00', close: '20:00' }, saturday: { open: '09:00', close: '18:00' } },
  },
  {
    ownerEmail: 'salon2@beautysalon.com', name: 'Diamond SPA & Beauty', priceRange: 3,
    description: 'Şehrin yorgunluğunu atmak için huzurlu SPA ve masaj deneyimi.',
    phone: '+902122345678', email: 'info@diamondspa.com',
    address: 'Halaskargazi Cad. No:234, Şişli', latitude: 41.0519, longitude: 28.9850,
    city: 'İstanbul', district: 'Şişli',
    workingHours: { monday: { open: '10:00', close: '21:00' }, tuesday: { open: '10:00', close: '21:00' }, wednesday: { open: '10:00', close: '21:00' }, thursday: { open: '10:00', close: '21:00' }, friday: { open: '10:00', close: '21:00' }, saturday: { open: '10:00', close: '21:00' }, sunday: { open: '11:00', close: '20:00' } },
  },
  {
    ownerEmail: 'salon@beautysalon.com', name: 'Glam Nail Studio', priceRange: 2,
    description: 'Tırnak sanatında sınırları zorlayan yaratıcı tasarımlar.',
    phone: '+902124567890', email: 'info@glamnail.com',
    address: 'İstasyon Cad. No:12, Bakırköy', latitude: 40.9803, longitude: 28.8773,
    city: 'İstanbul', district: 'Bakırköy',
    workingHours: { monday: { open: '10:00', close: '19:00' }, tuesday: { open: '10:00', close: '19:00' }, wednesday: { open: '10:00', close: '19:00' }, thursday: { open: '10:00', close: '19:00' }, friday: { open: '10:00', close: '18:00' }, saturday: { open: '10:00', close: '18:00' } },
  },
  {
    ownerEmail: 'salon2@beautysalon.com', name: 'Velvet Beauty Center', priceRange: 2,
    description: 'Makyaj ve cilt bakımında profesyonel dokunuş.',
    phone: '+902163456789', email: 'info@velvetbeauty.com',
    address: 'Atatürk Cad. No:56, Ataşehir', latitude: 40.9854, longitude: 29.1128,
    city: 'İstanbul', district: 'Ataşehir',
    workingHours: { monday: { open: '09:30', close: '20:30' }, tuesday: { open: '09:30', close: '20:30' }, wednesday: { open: '09:30', close: '20:30' }, thursday: { open: '09:30', close: '20:30' }, friday: { open: '10:00', close: '19:00' }, saturday: { open: '10:00', close: '19:00' } },
  },
  {
    ownerEmail: 'salon@beautysalon.com', name: 'Smooth Wax Center', priceRange: 1,
    description: 'Ağda ve epilasyon konusunda İstanbul\'un lider merkezi.',
    phone: '+902164567890', email: 'info@smoothwax.com',
    address: 'Büyük Hamam Sok. No:8, Üsküdar', latitude: 41.0255, longitude: 29.0154,
    city: 'İstanbul', district: 'Üsküdar',
    workingHours: { monday: { open: '09:00', close: '19:00' }, tuesday: { open: '09:00', close: '19:00' }, wednesday: { open: '09:00', close: '19:00' }, thursday: { open: '09:00', close: '19:00' }, friday: { open: '10:00', close: '17:00' }, saturday: { open: '10:00', close: '17:00' } },
  },
  {
    ownerEmail: 'salon2@beautysalon.com', name: 'Zen SPA & Masaj', priceRange: 3,
    description: 'Doğa ile bütünleşen, ruh ve beden dinginliği sunan premium SPA.',
    phone: '+902122876543', email: 'info@zenspa.com',
    address: 'Maslak Mah. No:102, Sarıyer', latitude: 41.1127, longitude: 29.0132,
    city: 'İstanbul', district: 'Sarıyer',
    workingHours: { monday: { open: '08:00', close: '22:00' }, tuesday: { open: '08:00', close: '22:00' }, wednesday: { open: '08:00', close: '22:00' }, thursday: { open: '08:00', close: '22:00' }, friday: { open: '09:00', close: '22:00' }, saturday: { open: '09:00', close: '22:00' }, sunday: { open: '09:00', close: '21:00' } },
  },
  {
    ownerEmail: 'salon@beautysalon.com', name: 'Glamour Hair Studio', priceRange: 2,
    description: 'Saç tasarımında yenilikçi teknikler ve modern trendler.',
    phone: '+902165678901', email: 'info@glamourhair.com',
    address: 'Bağlarbaşı Cad. No:34, Maltepe', latitude: 40.9358, longitude: 29.1258,
    city: 'İstanbul', district: 'Maltepe',
    workingHours: { monday: { open: '09:00', close: '20:00' }, tuesday: { open: '09:00', close: '20:00' }, wednesday: { open: '09:00', close: '20:00' }, thursday: { open: '09:00', close: '20:00' }, friday: { open: '09:00', close: '18:00' }, saturday: { open: '09:00', close: '18:00' } },
  },
  {
    ownerEmail: 'salon2@beautysalon.com', name: 'Petal Beauty & Nail', priceRange: 1,
    description: 'El ve ayak bakımında özenli hizmet, sevimli tasarımlar.',
    phone: '+902166789012', email: 'info@petalbeauty.com',
    address: 'Pendik Mah. No:67, Pendik', latitude: 40.8739, longitude: 29.2340,
    city: 'İstanbul', district: 'Pendik',
    workingHours: { monday: { open: '09:00', close: '19:30' }, tuesday: { open: '09:00', close: '19:30' }, wednesday: { open: '09:00', close: '19:30' }, thursday: { open: '09:00', close: '19:30' }, friday: { open: '10:00', close: '18:00' }, saturday: { open: '10:00', close: '18:00' } },
  },
  {
    ownerEmail: 'salon@beautysalon.com', name: 'Luxe Güzellik & SPA', priceRange: 3,
    description: 'Makyaj, cilt bakımı ve SPA hizmetlerini tek çatı altında sunuyoruz.',
    phone: '+902127890123', email: 'info@luxebeauty.com',
    address: 'Kavacık Mah. No:45, Beykoz', latitude: 41.1067, longitude: 29.0811,
    city: 'İstanbul', district: 'Beykoz',
    workingHours: { monday: { open: '10:00', close: '21:00' }, tuesday: { open: '10:00', close: '21:00' }, wednesday: { open: '10:00', close: '21:00' }, thursday: { open: '10:00', close: '21:00' }, friday: { open: '10:00', close: '20:00' }, saturday: { open: '10:00', close: '20:00' }, sunday: { open: '11:00', close: '19:00' } },
  },
  {
    ownerEmail: 'salon2@beautysalon.com', name: 'Blossom Kuaför & Epilasyon', priceRange: 1,
    description: 'Saç ve epilasyon hizmetlerinde uygun fiyat, kaliteli hizmet.',
    phone: '+902128901234', email: 'info@blossom.com',
    address: 'Gazi Cad. No:23, Sultangazi', latitude: 41.1058, longitude: 28.8817,
    city: 'İstanbul', district: 'Sultangazi',
    workingHours: { monday: { open: '08:30', close: '19:30' }, tuesday: { open: '08:30', close: '19:30' }, wednesday: { open: '08:30', close: '19:30' }, thursday: { open: '08:30', close: '19:30' }, friday: { open: '09:00', close: '18:00' }, saturday: { open: '09:00', close: '18:00' } },
  },
];

const STAFF = [
  { salonIndex: 0, fullName: 'Merve Demir', title: 'Kıdemli Kuaför', bio: '10 yıllık tecrübe ile saç tasarımı uzmanı' },
  { salonIndex: 0, fullName: 'Selin Arslan', title: 'Güzellik Uzmanı', bio: 'Cilt bakımı ve makyaj konusunda uzman' },
  { salonIndex: 0, fullName: 'Elif Öztürk', title: 'Tırnak Tasarımcısı', bio: 'Nail art ve protez tırnak uzmanı' },
  { salonIndex: 1, fullName: 'Ceren Yıldız', title: 'Saç Boyama Uzmanı', bio: 'Renk teorisi ve modern boya teknikleri uzmanı' },
  { salonIndex: 1, fullName: 'Büşra Çelik', title: 'Güzellik Uzmanı', bio: 'Makyaj ve cilt bakımı sertifikası' },
  { salonIndex: 6, fullName: 'Deniz Aksoy', title: 'Epilasyon Uzmanı', bio: 'Lazer ve klasik epilasyonda 8 yıllık deneyim' },
  { salonIndex: 7, fullName: 'Murat Şahin', title: 'Masaj Terapisti', bio: 'Klasik masaj, aromaterapi ve refleksoloji sertifikalı' },
];

const SERVICES = [
  { salonIndex: 0, name: 'Saç Kesimi', category: 'Saç', description: 'Profesyonel saç kesimi ve şekillendirme', price: 250, durationMinutes: 45, staff: ['Merve Demir'] },
  { salonIndex: 0, name: 'Saç Boyama', category: 'Saç', description: 'Kök boya veya komple boya uygulaması', price: 500, durationMinutes: 120, staff: ['Merve Demir'] },
  { salonIndex: 0, name: 'Ombre / Balyaj', category: 'Saç', description: 'Modern renk geçişli saç boyama', price: 1200, durationMinutes: 180, staff: ['Merve Demir'] },
  { salonIndex: 0, name: 'Manikür', category: 'Tırnak', description: 'El bakımı ve oje uygulaması', price: 150, durationMinutes: 45, staff: ['Elif Öztürk'] },
  { salonIndex: 0, name: 'Pedikür', category: 'Tırnak', description: 'Ayak bakımı ve oje uygulaması', price: 200, durationMinutes: 60, staff: ['Elif Öztürk'] },
  { salonIndex: 0, name: 'Cilt Bakımı', category: 'Cilt Bakımı', description: 'Derin temizlik ve nemlendirme', price: 400, durationMinutes: 60, staff: ['Selin Arslan'] },
  { salonIndex: 0, name: 'Profesyonel Makyaj', category: 'Makyaj', description: 'Özel gün veya günlük makyaj', price: 350, durationMinutes: 60, staff: ['Selin Arslan'] },
  { salonIndex: 1, name: 'Saç Kesimi & Fön', category: 'Saç', description: 'Kesim ve şekillendirme', price: 300, durationMinutes: 60, staff: ['Ceren Yıldız'] },
  { salonIndex: 1, name: 'Keratin Bakımı', category: 'Saç', description: 'Uzun ömürlü düzleştirme ve parlaklık', price: 800, durationMinutes: 150, staff: ['Ceren Yıldız'] },
  { salonIndex: 1, name: 'Gelin Makyajı', category: 'Makyaj', description: 'Özel gün makyajı paketi', price: 1500, durationMinutes: 90, staff: ['Büşra Çelik'] },
  { salonIndex: 1, name: 'Anti-Aging Bakım', category: 'Cilt Bakımı', description: 'Yaşlanma karşıtı özel cilt bakımı', price: 650, durationMinutes: 75, staff: ['Büşra Çelik'] },
  { salonIndex: 6, name: 'Bacak Epilasyon', category: 'Epilasyon', description: 'Tüm bacak ağda uygulaması', price: 400, durationMinutes: 60, staff: ['Deniz Aksoy'] },
  { salonIndex: 6, name: 'Brazilyan Epilasyon', category: 'Epilasyon', description: 'Detaylı bölge ağda uygulaması', price: 700, durationMinutes: 90, staff: ['Deniz Aksoy'] },
  { salonIndex: 6, name: 'Lazer Epilasyon', category: 'Epilasyon', description: 'Kalıcı çözüm için 8 seanslık lazer programı', price: 1200, durationMinutes: 45, staff: ['Deniz Aksoy'] },
  { salonIndex: 7, name: 'Klasik Masaj', category: 'SPA & Masaj', description: 'Sırt, boyun ve bacak masajı', price: 600, durationMinutes: 60, staff: ['Murat Şahin'] },
  { salonIndex: 7, name: 'Aromaterapi Masajı', category: 'SPA & Masaj', description: 'Doğal yağlarla rahatlattıcı masaj', price: 750, durationMinutes: 90, staff: ['Murat Şahin'] },
];

const REVIEWS = [
  { salonIndex: 0, service: 'Saç Kesimi', staff: 'Merve Demir', daysAgo: 5, startTime: '10:00:00', endTime: '10:45:00', rating: 5, comment: 'Harika bir deneyimdi! Merve Hanım çok ilgilendi, kesinlikle tavsiye ederim.', reply: null },
  { salonIndex: 0, service: 'Saç Boyama', staff: 'Merve Demir', daysAgo: 14, startTime: '13:00:00', endTime: '15:00:00', rating: 4, comment: 'Saç boyam çok güzel çıktı, renk tam istediğim gibiydi.', reply: 'Teşekkürler, sizi tekrar görmekten memnuniyet duyarız! 💖' },
  { salonIndex: 0, service: 'Cilt Bakımı', staff: 'Selin Arslan', daysAgo: 22, startTime: '11:00:00', endTime: '12:00:00', rating: 5, comment: 'Cilt bakımı sonrası yüzüm inanılmaz ferahladı. Selin Hanım çok profesyonel.', reply: null },
  { salonIndex: 0, service: 'Manikür', staff: 'Elif Öztürk', daysAgo: 35, startTime: '14:00:00', endTime: '14:45:00', rating: 4, comment: 'Manikür çok özenli yapıldı, tırnaklar mükemmel görünüyor.', reply: 'Güzel yorumunuz için teşekkürler! 🌸' },
  { salonIndex: 0, service: 'Profesyonel Makyaj', staff: 'Selin Arslan', daysAgo: 50, startTime: '09:00:00', endTime: '10:00:00', rating: 5, comment: 'Nişan makyajım için geldim, herkes çok beğendi. Ellerine sağlık!', reply: 'Tebrikler! Mutlu günlerinizde yanınızda olmak çok güzeldi. ✨' },
  { salonIndex: 6, service: 'Lazer Epilasyon', staff: 'Deniz Aksoy', daysAgo: 8, startTime: '11:00:00', endTime: '11:45:00', rating: 5, comment: '3. seansım, belirgin fark var. Deniz Hanım çok titiz çalışıyor.', reply: 'Memnuniyetiniz bizim için çok değerli! 🌟' },
  { salonIndex: 6, service: 'Bacak Epilasyon', staff: 'Deniz Aksoy', daysAgo: 19, startTime: '15:30:00', endTime: '16:30:00', rating: 4, comment: 'Hızlı ve temiz bir hizmet, ağda sonrası kızarıklık hemen geçti.', reply: null },
  { salonIndex: 7, service: 'Klasik Masaj', staff: 'Murat Şahin', daysAgo: 11, startTime: '17:00:00', endTime: '18:00:00', rating: 5, comment: 'Sırt ağrılarım tamamen geçti, ortam çok huzurlu.', reply: 'Teşekkür ederiz, tekrar bekleriz. 🌿' },
  { salonIndex: 7, service: 'Aromaterapi Masajı', staff: 'Murat Şahin', daysAgo: 27, startTime: '13:00:00', endTime: '14:30:00', rating: 4, comment: 'Yağların kokusu ve uygulama çok güzeldi, fiyat biraz yüksek.', reply: null },
];

const pastDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

// "var mı, yoksa oluştur" — unique constraint çakışmalarını önler
const findOrCreate = async (Model, where, values) => {
  const existing = await Model.findOne({ where });
  if (existing) return existing;
  return Model.create(values);
};

const seed = async () => {
  console.log('Seed başlatılıyor...');

  // ── Kullanıcılar ────────────────────────────────────────────────────────────
  const users = {};
  for (const u of USERS) {
    let user = await User.findOne({ where: { email: u.email } });

    if (!user && u.phone) {
      // phone unique kolonu: aynı telefon başka bir e-posta ile kayıtlıysa
      // telefon olmadan oluştur (seed'in çökmesini önler)
      const byPhone = await User.findOne({ where: { phone: u.phone } });
      if (byPhone) {
        console.warn(`  ! ${u.phone} telefonu ${byPhone.email} tarafından kullanılıyor, telefon atlanıyor`);
        user = await User.create({
          email: u.email,
          passwordHash: PASSWORDS[u.email],
          fullName: u.fullName,
          role: u.role,
          isVerified: true,
        });
      }
    }

    if (!user) {
      user = await User.create({
        email: u.email,
        phone: u.phone,
        passwordHash: PASSWORDS[u.email],
        fullName: u.fullName,
        role: u.role,
        isVerified: true,
      });
    }

    users[u.email] = user;
  }

  // ── Kategoriler ─────────────────────────────────────────────────────────────
  const categories = {};
  for (const c of CATEGORIES) {
    const cat = await findOrCreate(ServiceCategory, { name: c.name }, c);
    // eski kayıtlarda eksik kalabilen alanları tamamla
    if (cat.iconName == null || cat.sortOrder == null) {
      await cat.update({ iconName: c.iconName, sortOrder: c.sortOrder });
    }
    categories[c.name] = cat;
  }

  // ── Salonlar ────────────────────────────────────────────────────────────────
  const salons = [];
  for (const s of SALONS) {
    const salon = await findOrCreate(Salon, { name: s.name }, {
      ...s,
      ownerId: users[s.ownerEmail].id,
      ratingAvg: 0,
      reviewCount: 0,
      isActive: true,
      isVerified: true,
    });
    salons.push(salon);
  }

  // ── Çalışanlar ──────────────────────────────────────────────────────────────
  const staffByName = {};
  for (const s of STAFF) {
    const staff = await findOrCreate(Staff, { salon_id: salons[s.salonIndex].id, full_name: s.fullName }, {
      salonId: salons[s.salonIndex].id,
      fullName: s.fullName,
      title: s.title,
      bio: s.bio,
    });
    staffByName[s.fullName] = staff;
  }

  // ── Hizmetler (category_id onarımı dahil) ───────────────────────────────────
  const serviceByName = {};
  for (const s of SERVICES) {
    const salon = salons[s.salonIndex];
    const categoryId = categories[s.category].id;

    let service = await Service.findOne({ where: { salon_id: salon.id, name: s.name } });

    if (service) {
      // Eski/bozuk veri: salon veya kategori bağlanmamışsa onar
      if (service.salonId !== salon.id || service.categoryId !== categoryId) {
        await service.update({ salonId: salon.id, categoryId });
      }
    } else {
      service = await Service.create({
        salonId: salon.id,
        categoryId,
        name: s.name,
        description: s.description,
        price: s.price,
        durationMinutes: s.durationMinutes,
      });
    }

    serviceByName[s.name] = service;
  }

  // Yetim hizmetler (salon_id NULL) — seed verisi değil, temizle
  const orphans = await Service.findAll({ where: { salon_id: null } });
  if (orphans.length > 0) {
    for (const o of orphans) await o.destroy();
    console.log(`  ! ${orphans.length} yetim hizmet temizlendi`);
  }

  // ── Staff ↔ Service bağlantıları ────────────────────────────────────────────
  for (const s of SERVICES) {
    for (const staffName of s.staff) {
      const staff = staffByName[staffName];
      const service = serviceByName[s.name];
      if (!staff || !service) continue;
      const exists = await StaffService.findOne({ where: { staff_id: staff.id, service_id: service.id } });
      if (!exists) await StaffService.create({ staffId: staff.id, serviceId: service.id });
    }
  }

  // ── Tamamlanmış randevular & yorumlar ───────────────────────────────────────
  const customer = users['musteri@beautysalon.com'];

  for (const r of REVIEWS) {
    const salon = salons[r.salonIndex];
    const service = serviceByName[r.service];
    const staff = staffByName[r.staff];
    const date = pastDate(r.daysAgo);

    let appointment = await Appointment.findOne({
      where: { customer_id: customer.id, salon_id: salon.id, date, start_time: r.startTime },
    });

    if (!appointment) {
      appointment = await Appointment.create({
        customerId: customer.id,
        salonId: salon.id,
        staffId: staff.id,
        serviceId: service.id,
        date,
        startTime: r.startTime,
        endTime: r.endTime,
        status: 'COMPLETED',
      });
    }

    await findOrCreate(Review, { appointment_id: appointment.id }, {
      customerId: customer.id,
      salonId: salon.id,
      appointmentId: appointment.id,
      rating: r.rating,
      comment: r.comment,
      salonReply: r.reply,
      salonReplyAt: r.reply ? new Date() : null,
      isVisible: true,
    });
  }

  // ── Salon rating ortalamalarını gerçek yorumlardan hesapla ──────────────────
  for (const salon of salons) {
    const reviews = await Review.findAll({ where: { salon_id: salon.id, is_visible: true } });
    if (reviews.length === 0) continue;
    const total = reviews.reduce((sum, rev) => sum + rev.rating, 0);
    await salon.update({
      ratingAvg: Math.round((total / reviews.length) * 10) / 10,
      reviewCount: reviews.length,
    });
  }

  console.log(`Seed tamamlandı! ${salons.length} salon, ${SERVICES.length} hizmet, ${CATEGORIES.length} kategori.`);
  console.log('Admin: admin@beautysalon.com / Admin123!');
  console.log('Salon Sahibi: salon@beautysalon.com / Salon123!');
  console.log('Müşteri: musteri@beautysalon.com / Musteri123!');
};

module.exports = seed;
