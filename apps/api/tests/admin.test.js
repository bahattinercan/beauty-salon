const supertest = require('supertest');
const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { syncDB, seedTestData } = require('./setup');

const request = supertest(app);
const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-unit-tests-only-32chars!';

let adminToken;
let ownerToken;

describe('Admin API', () => {
  before(async () => {
    await syncDB();
    await seedTestData();

    const login = await request.post('/api/v1/auth/login').send({
      email: 'admin@test.com',
      password: 'Admin123!',
    });
    adminToken = login.body.data?.accessToken;

    const ownerLogin = await request.post('/api/v1/auth/login').send({
      email: 'owner1@test.com',
      password: 'Owner123!',
    });
    ownerToken = ownerLogin.body.data?.accessToken;
  });

  describe('yetkilendirme', () => {
    it('token yoksa 401 döner', async () => {
      const res = await request.get('/api/v1/admin/dashboard');
      expect(res.status).to.equal(401);
      expect(res.body.success).to.equal(false);
    });

    it('salon sahibi admin endpointlerine erişemez (403)', async () => {
      const res = await request
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(res.status).to.equal(403);
    });

    it('geçersiz token 401 döner', async () => {
      const res = await request
        .get('/api/v1/admin/salons')
        .set('Authorization', 'Bearer bogus-token');
      expect(res.status).to.equal(401);
    });
  });

  describe('GET /admin/dashboard', () => {
    it('admin dashboard istatistiklerini döndürür', async () => {
      const res = await request
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      const stats = res.body.data.stats;
      expect(stats.totalUsers).to.be.a('number');
      expect(stats.totalSalons).to.be.a('number');
      expect(stats.totalAppointments).to.be.a('number');
      expect(stats.pendingSalons).to.be.a('number');
    });

    it('gelir istatistiği ve aylık randevu listesi alanları mevcut', async () => {
      const res = await request
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      const data = res.body.data;
      expect(data.stats.totalRevenue).to.be.a('string');
      expect(data.appointmentsByStatus).to.be.an('array');
      expect(data.monthlyAppointments).to.be.an('array');
      expect(data.recentReviews).to.be.an('array');
    });
  });

  describe('GET /admin/salons', () => {
    it('salonları sayfalı listeler (data + meta)', async () => {
      const res = await request
        .get('/api/v1/admin/salons?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data.data).to.be.an('array');
      expect(res.body.data.meta.total).to.be.a('number');
      expect(res.body.data.meta.page).to.equal(1);
    });
  });

  describe('GET /admin/salons — filtre, sıralama, sayaçlar (AP-007)', () => {
    let owner1;
    let owner2;

    const getSalons = (query) => request
      .get('/api/v1/admin/salons')
      .query(query)
      .set('Authorization', `Bearer ${adminToken}`);

    before(async () => {
      const { User, Salon } = require('../src/models');
      owner1 = await User.findOne({ where: { email: 'owner1@test.com' } });
      owner2 = await User.findOne({ where: { email: 'owner2@test.com' } });

      // Seed: Elegance (İstanbul, onaylı, rating 5) + Bella (İstanbul, onaylı, rating 0)
      await Promise.all([
        Salon.create({
          ownerId: owner2.id,
          name: 'Zeynep Kuaför',
          phone: '+902121112233',
          address: 'Tunalı Hilmi Cad. No:5, Çankaya',
          latitude: 39.9042,
          longitude: 32.8597,
          city: 'Ankara',
          district: 'Çankaya',
          ratingAvg: 4.8,
          isActive: true,
          isVerified: true,
        }),
        Salon.create({
          ownerId: owner1.id,
          name: 'Aylin Güzellik',
          phone: '+902324445566',
          address: 'Kordon Boyu No:12, Bornova',
          latitude: 38.4237,
          longitude: 27.1428,
          city: 'İzmir',
          district: 'Bornova',
          ratingAvg: 3.2,
          isActive: true,
          isVerified: false,
        }),
        Salon.create({
          ownerId: owner2.id,
          name: 'Meltem Spa',
          phone: '+903127778899',
          address: 'Kızılay Meydanı No:3, Çankaya',
          latitude: 39.9208,
          longitude: 32.8541,
          city: 'Ankara',
          district: 'Kızılay',
          ratingAvg: 4.4,
          isActive: false,
          isVerified: true,
        }),
        Salon.create({
          ownerId: owner1.id,
          name: 'Deniz Makyaj',
          phone: '+902241234567',
          address: 'Nilüfer Çarşı No:7, Nilüfer',
          latitude: 40.2130,
          longitude: 28.9720,
          city: 'Bursa',
          district: 'Nilüfer',
          ratingAvg: 2.5,
          isActive: true,
          isVerified: true,
        }),
      ]);
    });

    it('status=onaylı yalnız isActive+isVerified satırları döndürür', async () => {
      const res = await getSalons({ status: 'onaylı', limit: 100 });

      expect(res.status).to.equal(200);
      const { data, meta } = res.body.data;
      expect(meta.total).to.equal(4);
      expect(meta.total).to.equal(meta.counts['onaylı']);
      expect(data.length).to.equal(4);
      data.forEach((salon) => {
        expect(salon.isActive).to.equal(true);
        expect(salon.isVerified).to.equal(true);
      });
    });

    it('status=bekliyor yalnız isActive+!isVerified satırları döndürür', async () => {
      const res = await getSalons({ status: 'bekliyor', limit: 100 });

      expect(res.status).to.equal(200);
      const { data, meta } = res.body.data;
      expect(meta.total).to.equal(1);
      expect(data[0].name).to.equal('Aylin Güzellik');
      expect(data[0].isActive).to.equal(true);
      expect(data[0].isVerified).to.equal(false);
    });

    it('status=pasif yalnız !isActive satırları döndürür', async () => {
      const res = await getSalons({ status: 'pasif', limit: 100 });

      expect(res.status).to.equal(200);
      const { data, meta } = res.body.data;
      expect(meta.total).to.equal(1);
      expect(data[0].name).to.equal('Meltem Spa');
      expect(data[0].isActive).to.equal(false);
    });

    it('search salon adında eşleşir', async () => {
      const res = await getSalons({ search: 'Elegance' });

      expect(res.status).to.equal(200);
      expect(res.body.data.meta.total).to.equal(1);
      expect(res.body.data.data[0].name).to.equal('Elegance Beauty Studio');
    });

    it('search sahip adında eşleşir ve count join yüzünden şişmez', async () => {
      const res = await getSalons({ search: 'Fatma', limit: 100 });

      expect(res.status).to.equal(200);
      const { data, meta } = res.body.data;
      // Fatma Demir: Bella Güzellik, Zeynep Kuaför, Meltem Spa
      expect(meta.total).to.equal(3);
      expect(data.length).to.equal(3);
      data.forEach((salon) => {
        expect(salon.owner.fullName).to.equal('Fatma Demir');
      });
    });

    it('search adres/şehir/ilçede büyük-küçük harf duyarsız eşleşir', async () => {
      const address = await getSalons({ search: 'BARBAROS' });
      expect(address.body.data.meta.total).to.equal(1);
      expect(address.body.data.data[0].name).to.equal('Bella Güzellik');

      const district = await getSalons({ search: 'kadıköy' });
      expect(district.body.data.meta.total).to.equal(1);
      expect(district.body.data.data[0].name).to.equal('Elegance Beauty Studio');
    });

    it('city filtresi tam eşleşir', async () => {
      const res = await getSalons({ city: 'Ankara', limit: 100 });

      expect(res.status).to.equal(200);
      expect(res.body.data.meta.total).to.equal(2);
      res.body.data.data.forEach((salon) => {
        expect(salon.city).to.equal('Ankara');
      });
    });

    it('minRating yalnız eşik üstü puanlıları döndürür', async () => {
      const res = await getSalons({ minRating: 4, limit: 100 });

      expect(res.status).to.equal(200);
      expect(res.body.data.meta.total).to.equal(3);
      res.body.data.data.forEach((salon) => {
        expect(salon.ratingAvg).to.be.at.least(4);
      });
    });

    it('sort=name&order=asc alfabetik sıralar', async () => {
      const res = await getSalons({ sort: 'name', order: 'asc', limit: 100 });

      expect(res.status).to.equal(200);
      const names = res.body.data.data.map((salon) => salon.name);
      expect(names).to.deep.equal([
        'Aylin Güzellik',
        'Bella Güzellik',
        'Deniz Makyaj',
        'Elegance Beauty Studio',
        'Meltem Spa',
        'Zeynep Kuaför',
      ]);
    });

    it('sort=rating&order=desc puana göre azalan sıralar', async () => {
      const res = await getSalons({ sort: 'rating', order: 'desc', limit: 100 });

      expect(res.status).to.equal(200);
      const ratings = res.body.data.data.map((salon) => salon.ratingAvg);
      expect(ratings).to.deep.equal([...ratings].sort((a, b) => b - a));
      expect(ratings[0]).to.equal(5);
      expect(ratings[1]).to.equal(4.8);
    });

    it('limit=1000 kırpılır, limit=50 korunur', async () => {
      const clipped = await getSalons({ limit: 1000 });
      expect(clipped.status).to.equal(200);
      expect(clipped.body.data.meta.limit).to.equal(100);

      const fifty = await getSalons({ limit: 50 });
      expect(fifty.body.data.meta.limit).to.equal(50);
      expect(fifty.body.data.meta.total).to.equal(6);
    });

    it('meta.counts global ve tutarlı, meta.cities distinct', async () => {
      const plain = await getSalons({ limit: 100 });
      const { meta } = plain.body.data;

      expect(meta.counts['tümü']).to.equal(meta.total);
      expect(meta.counts['onaylı'] + meta.counts['bekliyor'] + meta.counts['pasif'])
        .to.equal(meta.counts['tümü']);
      expect(meta.counts['tümü']).to.equal(6);
      expect(meta.cities).to.have.members(['Ankara', 'Bursa', 'İstanbul', 'İzmir']);
      expect(meta.cities.length).to.equal(4);

      // Filtreli istekte sayaçlar global kalır
      const filtered = await getSalons({ status: 'pasif' });
      expect(filtered.body.data.meta.total).to.equal(1);
      expect(filtered.body.data.meta.counts['tümü']).to.equal(6);
    });

    it('geçersiz status 400 döndürür', async () => {
      const res = await getSalons({ status: 'xyz' });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.equal(false);
      expect(res.body.errors).to.be.an('array').that.is.not.empty;
    });

    it("verified=true geriye uyumlu çalışır, status ile AND'lenir", async () => {
      const verified = await getSalons({ verified: 'true', limit: 100 });
      expect(verified.status).to.equal(200);
      verified.body.data.data.forEach((salon) => {
        expect(salon.isVerified).to.equal(true);
      });

      const both = await getSalons({ verified: 'true', status: 'bekliyor' });
      expect(both.body.data.meta.total).to.equal(0);
    });
  });

  describe('GET /admin/appointments', () => {
    it('tüm randevuları listeler', async () => {
      const res = await request
        .get('/api/v1/admin/appointments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.data.data).to.be.an('array');
    });
  });

  describe('GET /admin/appointments filtreleri', () => {
    let salon2;
    let staff2;
    let extraAppointment;

    const getAppointments = (query) => request
      .get('/api/v1/admin/appointments')
      .query(query)
      .set('Authorization', `Bearer ${adminToken}`);

    const addDays = (days) => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      return date.toISOString().split('T')[0];
    };

    before(async () => {
      const { Salon, Staff, Service, User, Appointment } = require('../src/models');

      salon2 = await Salon.findOne({ where: { name: 'Bella Güzellik' } });
      const service4 = await Service.findOne({ where: { name: 'Pedikür' } });
      const customer2 = await User.findOne({ where: { email: 'customer2@test.com' } });

      // salon2 + ayrı personel + ayrı hizmet: salonId/staffId/search ayrımı için tek randevu
      staff2 = await Staff.create({
        salonId: salon2.id,
        fullName: 'Buse Kılıç',
        title: 'Pedikür Uzmanı',
        isActive: true,
      });
      extraAppointment = await Appointment.create({
        customerId: customer2.id,
        salonId: salon2.id,
        staffId: staff2.id,
        serviceId: service4.id,
        date: addDays(30),
        startTime: '09:00:00',
        endTime: '10:00:00',
        status: 'PENDING',
      });
    });

    after(async () => {
      if (extraAppointment) await extraAppointment.destroy();
      if (staff2) await staff2.destroy();
    });

    it('parametresiz istek mevcut davranışı korur (createdAt DESC)', async () => {
      const res = await getAppointments({});

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      const { data, meta } = res.body.data;
      expect(data).to.be.an('array').that.is.not.empty;
      expect(meta.total).to.be.a('number');
      expect(meta.page).to.equal(1);
      expect(meta.limit).to.equal(20);

      const createdAt = data.map((row) => new Date(row.createdAt).getTime());
      expect(createdAt).to.deep.equal([...createdAt].sort((a, b) => b - a));
    });

    it('status=COMPLETED yalnız COMPLETED satırları döndürür', async () => {
      const res = await getAppointments({ status: 'COMPLETED', limit: 100 });

      expect(res.status).to.equal(200);
      const { data, meta } = res.body.data;
      expect(meta.total).to.be.greaterThan(0);
      expect(data.length).to.equal(meta.total);
      data.forEach((row) => {
        expect(row.status).to.equal('COMPLETED');
      });
      expect(meta.total).to.equal(meta.counts.COMPLETED);
    });

    it('search müşteri adında eşleşir (customer.fullName)', async () => {
      const res = await getAppointments({ search: 'zeynep', limit: 100 });

      expect(res.status).to.equal(200);
      const { data, meta } = res.body.data;
      expect(meta.total).to.equal(2);
      expect(data.length).to.equal(2);
      data.forEach((row) => {
        expect(row.customer.fullName.toLowerCase()).to.contain('zeynep');
      });
    });

    it('search personel adında eşleşir, count join yüzünden şişmez (staff.fullName)', async () => {
      const res = await getAppointments({ search: 'Buse', limit: 100 });

      expect(res.status).to.equal(200);
      const { data, meta } = res.body.data;
      expect(meta.total).to.equal(1);
      expect(data.length).to.equal(1);
      expect(data[0].staff.fullName).to.equal('Buse Kılıç');
      expect(data[0].id).to.equal(extraAppointment.id);
    });

    it('search hizmet adında eşleşir (service.name)', async () => {
      const res = await getAppointments({ search: 'pedik', limit: 100 });

      expect(res.status).to.equal(200);
      const { data, meta } = res.body.data;
      expect(meta.total).to.equal(1);
      expect(data[0].service.name).to.equal('Pedikür');
    });

    it('salonId filtresi yalnız o salonun randevularını döndürür', async () => {
      const res = await getAppointments({ salonId: salon2.id, limit: 100 });

      expect(res.status).to.equal(200);
      const { data, meta } = res.body.data;
      expect(meta.total).to.equal(1);
      expect(data[0].salonId).to.equal(salon2.id);
      data.forEach((row) => {
        expect(row.salonId).to.equal(salon2.id);
      });
    });

    it('staffId filtresi yalnız o personelin randevularını döndürür', async () => {
      const res = await getAppointments({ staffId: staff2.id, limit: 100 });

      expect(res.status).to.equal(200);
      const { data, meta } = res.body.data;
      expect(meta.total).to.equal(1);
      data.forEach((row) => {
        expect(row.staffId).to.equal(staff2.id);
      });
    });

    it('dateFrom/dateTo aralık filtresi aralık dışını döndürmez', async () => {
      const inRange = await getAppointments({ dateFrom: addDays(29), dateTo: addDays(31), limit: 100 });
      expect(inRange.status).to.equal(200);
      expect(inRange.body.data.meta.total).to.equal(1);
      expect(inRange.body.data.data[0].id).to.equal(extraAppointment.id);

      const outside = await getAppointments({ dateFrom: '2020-01-01', dateTo: '2020-12-31' });
      expect(outside.status).to.equal(200);
      expect(outside.body.data.meta.total).to.equal(0);
      expect(outside.body.data.data).to.deep.equal([]);
    });

    it('sort=date&order=asc tarihleri artan sıralar, varsayılan createdAt DESC', async () => {
      const byDate = await getAppointments({ sort: 'date', order: 'asc', limit: 100 });
      expect(byDate.status).to.equal(200);
      const dates = byDate.body.data.data.map((row) => row.date);
      expect(dates).to.deep.equal([...dates].sort());

      const byDateDesc = await getAppointments({ sort: 'date', order: 'desc', limit: 100 });
      expect(byDateDesc.body.data.data.map((row) => row.date)).to.deep.equal([...dates].reverse());

      const explicit = await getAppointments({ sort: 'createdAt', order: 'desc', limit: 100 });
      const plain = await getAppointments({ limit: 100 });
      expect(explicit.body.data.data.map((row) => row.id))
        .to.deep.equal(plain.body.data.data.map((row) => row.id));
    });

    it('meta.counts filtrelerden bağımsız global, meta.salons/staff dizi', async () => {
      const { Appointment } = require('../src/models');
      const { fn, col } = require('sequelize');

      const plain = await getAppointments({ limit: 100 });
      const { meta } = plain.body.data;

      expect(meta.counts['tümü']).to.equal(meta.total);
      expect(meta.counts).to.have.all.keys(
        'tümü', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW',
      );

      const statusRows = await Appointment.findAll({
        attributes: ['status', [fn('COUNT', col('id')), 'n']],
        group: ['status'],
        raw: true,
      });
      statusRows.forEach((row) => {
        expect(meta.counts[row.status]).to.equal(parseInt(row.n, 10));
      });
      const sum = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']
        .reduce((total, key) => total + meta.counts[key], 0);
      expect(sum).to.equal(meta.counts['tümü']);

      expect(meta.salons).to.be.an('array').that.is.not.empty;
      expect(meta.staff).to.be.an('array').that.is.not.empty;
      meta.salons.forEach((salon) => {
        expect(salon).to.have.all.keys('id', 'name');
      });
      meta.staff.forEach((member) => {
        expect(member).to.have.all.keys('id', 'fullName');
      });
      const salonNames = meta.salons.map((salon) => salon.name);
      expect(salonNames).to.deep.equal([...salonNames].sort());
      const staffNames = meta.staff.map((member) => member.fullName);
      expect(staffNames).to.deep.equal([...staffNames].sort());

      // Filtreli istekte sayaçlar global kalır
      const filtered = await getAppointments({ status: 'COMPLETED' });
      expect(filtered.body.data.meta.total).to.equal(meta.counts.COMPLETED);
      expect(filtered.body.data.meta.counts['tümü']).to.equal(meta.counts['tümü']);
    });

    it('geçersiz status/sort/order ve ters tarih aralığı 400 döndürür', async () => {
      const badStatus = await getAppointments({ status: 'xyz' });
      expect(badStatus.status).to.equal(400);
      expect(badStatus.body.success).to.equal(false);
      expect(badStatus.body.errors).to.be.an('array').that.is.not.empty;

      const badSort = await getAppointments({ sort: 'foo' });
      expect(badSort.status).to.equal(400);

      const badOrder = await getAppointments({ order: 'sideways' });
      expect(badOrder.status).to.equal(400);

      const badRange = await getAppointments({ dateFrom: '2025-12-31', dateTo: '2025-01-01' });
      expect(badRange.status).to.equal(400);
      expect(badRange.body.errors).to.be.an('array').that.is.not.empty;
    });

    it('limit=1000 kırpılır', async () => {
      const res = await getAppointments({ limit: 1000 });

      expect(res.status).to.equal(200);
      expect(res.body.data.meta.limit).to.equal(100);
    });
  });

  describe('GET /admin/reviews', () => {
    it('yorumları müşteri ve salon bilgisiyle döndürür', async () => {
      const res = await request
        .get('/api/v1/admin/reviews')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      const reviews = res.body.data.data;
      expect(reviews).to.be.an('array');
      if (reviews.length > 0) {
        expect(reviews[0]).to.have.property('rating');
      }
    });
  });
});
