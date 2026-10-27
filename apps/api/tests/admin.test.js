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
