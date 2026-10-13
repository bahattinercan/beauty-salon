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
