const supertest = require('supertest');
const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { syncDB, seedTestData } = require('./setup');

const request = supertest(app);
const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-unit-tests-only-32chars!';

const tokenFor = (user) =>
  jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

describe('Settings API', () => {
  let admin, owner, adminToken, ownerToken;

  before(async () => {
    await syncDB();
    const data = await seedTestData();
    admin = data.users.admin;
    owner = data.users.owner1 || data.users.admin;
    adminToken = tokenFor(admin);
    ownerToken = tokenFor(owner);
  });

  describe('GET /settings', () => {
    it('varsayılan ayarları döndürür', async () => {
      const res = await request
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data.platformName).to.equal('Beauty Salon');
      expect(res.body.data.maxLoginAttempts).to.equal(5);
      expect(res.body.data.maintenanceModeEnabled).to.equal(false);
    });

    it('token yoksa 401', async () => {
      const res = await request.get('/api/v1/settings');
      expect(res.status).to.equal(401);
    });

    it('salon sahibi erişemez (403)', async () => {
      const res = await request
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(res.status).to.equal(403);
    });
  });

  describe('PUT /settings', () => {
    it('ayarları kaydeder ve geri okunur', async () => {
      const res = await request
        .put('/api/v1/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          platformName: 'Güzellik Merkezi Pro',
          supportPhone: '+90 555 123 45 67',
          maintenanceModeEnabled: true,
        });

      expect(res.status).to.equal(200);
      expect(res.body.data.platformName).to.equal('Güzellik Merkezi Pro');
      expect(res.body.data.supportPhone).to.equal('+90 555 123 45 67');
      expect(res.body.data.maintenanceModeEnabled).to.equal(true);

      const again = await request
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(again.body.data.platformName).to.equal('Güzellik Merkezi Pro');
    });

    it('kısmi güncelleme diğer ayarları bozmaz', async () => {
      await request
        .put('/api/v1/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ maxLoginAttempts: 10 });

      const res = await request
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.body.data.maxLoginAttempts).to.equal(10);
      expect(res.body.data.platformName).to.equal('Güzellik Merkezi Pro');
    });

    it('boş gövde 200 döner (no-op)', async () => {
      const res = await request
        .put('/api/v1/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('object');
    });
  });
});
