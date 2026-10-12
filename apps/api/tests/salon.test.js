const supertest = require('supertest');
const { expect } = require('chai');
const app = require('../src/app');
const { syncDB, seedTestData, teardownDB } = require('./setup');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-unit-tests-only-32chars!';

const createToken = (user) => {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
};

describe('Salon API', () => {
  let data;
  let owner1, owner2, customer, salon1, salon2;
  let owner1Token, owner2Token, adminToken, customerToken;
  let admin, Salon, User;

  before(async () => {
    await syncDB();
    data = await seedTestData();
    owner1 = data.users.owner1;
    owner2 = data.users.owner2;
    customer = data.users.customer;
    salon1 = data.salons.salon1;
    salon2 = data.salons.salon2;
    owner1Token = createToken(owner1);
    owner2Token = createToken(owner2);
    customerToken = createToken(customer);
    admin = data.users.admin;
    adminToken = createToken(admin);
    Salon = require('../src/models').Salon;
    User = require('../src/models').User;
  });

  after(async () => {
    await teardownDB();
  });

  describe('GET /salons', () => {
    it('should return paginated list of verified active salons', async () => {
      const res = await supertest(app)
        .get('/api/v1/salons');

      expect(res).to.equal();
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('data');
      expect(res.body.data).to.have.property('meta');
      expect(res.body.data.meta).to.have.property('total');
      expect(res.body.data.meta).to.have.property('totalPages');
      expect(res.body.data.data.length).to.be.greaterThan(0);
    });

    it('should filter by city', async () => {
      const res = await supertest(app)
        .get('/api/v1/salons')
        .query({ city: 'İstanbul' });

      expect(res).to.equal();
      res.body.data.data.forEach(salon => {
        expect(salon.city).to.equal('İstanbul');
      });
    });

    it('should filter by district', async () => {
      const res = await supertest(app)
        .get('/api/v1/salons')
        .query({ district: 'Kadıköy' });

      expect(res).to.equal();
      res.body.data.data.forEach(salon => {
        expect(salon.district).to.equal('Kadıköy');
      });
    });

    it('should filter by minimum rating', async () => {
      const res = await supertest(app)
        .get('/api/v1/salons')
        .query({ minRating: '4.5' });

      expect(res).to.equal();
      res.body.data.data.forEach(salon => {
        expect(salon.ratingAvg).to.be.greaterThanOrEqual(4.5);
      });
    });

    it('should filter by search term', async () => {
      const res = await supertest(app)
        .get('/api/v1/salons')
        .query({ search: 'Elegance' });

      expect(res).to.equal();
      res.body.data.data.forEach(salon => {
        expect(salon.name.toLowerCase()).to.include('elegance');
      });
    });

    it('should sort by rating when sortBy=rating', async () => {
      const res = await supertest(app)
        .get('/api/v1/salons')
        .query({ sortBy: 'rating' });

      expect(res).to.equal();
      const salons = res.body.data.data;
      for (let i = 0; i < salons.length - 1; i++) {
        expect(salons[i].ratingAvg).to.be.greaterThanOrEqual(salons[i + 1].ratingAvg);
      }
    });

    it('should only return verified and active salons', async () => {
      const { Salon } = require('../src/models');
      // Create an unverified salon
      const unverified = await Salon.create({
        ownerId: owner1.id,
        name: 'Unverified Salon',
        phone: '+905550000000',
        address: 'Test Cad. No:1',
        latitude: 40.9833,
        longitude: 29.0500,
        city: 'İstanbul',
        district: 'Test',
        isActive: true,
        isVerified: false,
      });

      const res = await supertest(app)
        .get('/api/v1/salons')
        .query({ search: 'Unverified' });

      expect(res).to.equal();
      expect(res.body.data.data.length).to.equal(0); // Unverified should not appear

      // Clean up
      await unverified.destroy();
    });

    it('should support pagination', async () => {
      const res1 = await supertest(app)
        .get('/api/v1/salons')
        .query({ page: 1, limit: 2 });

      const res2 = await supertest(app)
        .get('/api/v1/salons')
        .query({ page: 2, limit: 2 });

      expect(res1.body.data.data.length).to.be.lessThanOrEqual(2);
      expect(res2.body.data.data.length).to.be.lessThanOrEqual(2);

      // Pages should have different data
      const page1Ids = res1.body.data.data.map(s => s.id);
      const page2Ids = res2.body.data.data.map(s => s.id);
      expect(page1Ids).to.not.deep.equal(page2Ids);
    });
  });

  describe('GET /salons/nearby', () => {
    it('should return salons within the specified radius', async () => {
      const res = await supertest(app)
        .get('/api/v1/salons/nearby')
        .query({
          latitude: 40.9833,
          longitude: 29.0500,
          radius: 10,
        });

      expect(res).to.equal();
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('data');
      expect(res.body.data.data).to.be.an('array');
    });

    it('should return salons sorted by distance', async () => {
      const res = await supertest(app)
        .get('/api/v1/salons/nearby')
        .query({
          latitude: 40.9833,
          longitude: 29.0500,
          radius: 50,
        });

      expect(res).to.equal();
      const salons = res.body.data.data;
      for (let i = 0; i < salons.length - 1; i++) {
        expect(salons[i].distance).to.be.lessThanOrEqual(salons[i + 1].distance);
      }
    });

    it('should not return salons outside the radius', async () => {
      const res = await supertest(app)
        .get('/api/v1/salons/nearby')
        .query({
          latitude: 40.9833,
          longitude: 29.0500,
          radius: 0.001, // 1 meter - should return nothing
        });

      expect(res).to.equal();
      expect(res.body.data.data.length).to.equal(0);
    });
  });

  describe('GET /salons/:id', () => {
    it('should return salon details with owner, staff, and services', async () => {
      const res = await supertest(app)
        .get(`/api/v1/salons/${salon1.id}`);

      expect(res).to.equal();
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('id');
      expect(res.body.data).to.have.property('owner');
      expect(res.body.data.owner).to.have.property('fullName');
      expect(res.body.data).to.have.property('staff');
      expect(res.body.data).to.have.property('services');
    });

    it('should return 404 for non-existent salon', async () => {
      const res = await supertest(app)
        .get('/api/v1/salons/00000000-0000-0000-0000-000000000000');

      expect(res).to.equal();
    });

    it('should include services grouped by category', async () => {
      const res = await supertest(app)
        .get(`/api/v1/salons/${salon1.id}`);

      expect(res).to.equal();
      const services = res.body.data.services;
      expect(services).to.be.an('array');
      services.forEach(service => {
        expect(service).to.have.property('category');
        expect(service.category).to.have.property('name');
      });
    });
  });

  describe('POST /salons', () => {
    it('should create a new salon for the authenticated owner', async () => {
      const res = await supertest(app)
        .post('/api/v1/salons')
        .set('Authorization', `Bearer ${owner2Token}`)
        .send({
          name: 'New Salon',
          phone: '+905551234567',
          address: 'Test Cad. No:1',
          latitude: 40.9833,
          longitude: 29.0500,
          city: 'İstanbul',
          district: 'Test',
          workingHours: JSON.stringify({ monday: { open: '09:00', close: '18:00' } }),
        });

      expect(res).to.equal();
      expect(res.body.data).to.have.property('ownerId');
      expect(res.body.data.ownerId).to.equal(owner2.id);
      expect(res.body.data).to.have.property('isVerified', false);

      // Clean up
      await Salon.findByPk(res.body.data.id).then(s => s.destroy());
    });

    it('should return 401 for unauthenticated request', async () => {
      const res = await supertest(app)
        .post('/api/v1/salons')
        .send({
          name: 'Unauthorized Salon',
          phone: '+905551234567',
          address: 'Test',
          latitude: 40.9833,
          longitude: 29.0500,
          city: 'İstanbul',
          district: 'Test',
        });

      expect(res).to.equal();
    });
  });

  describe('PATCH /salons/:id', () => {
    it('should allow owner to update their salon', async () => {
      const salon = await Salon.findByPk(salon1.id);
      const token = createToken(salon.owner);

      const res = await supertest(app)
        .patch(`/api/v1/salons/${salon.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Salon Name' });

      expect(res).to.equal();
      expect(res.body.data.name).to.equal('Updated Salon Name');

      // Restore
      salon.name = 'Elegance Beauty Studio';
      await salon.save();
    });

    it('should return 403 when another owner tries to update', async () => {
      const res = await supertest(app)
        .patch(`/api/v1/salons/${salon1.id}`)
        .set('Authorization', `Bearer ${owner2Token}`)
        .send({ name: 'Hacked Name' });

      expect(res).to.equal();
    });

    it('should allow admin to update any salon', async () => {
      const res = await supertest(app)
        .patch(`/api/v1/salons/${salon1.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Admin Updated' });

      expect(res).to.equal();

      // Restore
      salon1.name = 'Elegance Beauty Studio';
      await salon1.save();
    });

    it('should return 404 for non-existent salon', async () => {
      const res = await supertest(app)
        .patch('/api/v1/salons/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${owner1Token}`);

      expect(res).to.equal();
    });
  });

  describe('DELETE /salons/:id (soft delete)', () => {
    it('should soft delete the salon (set isActive: false)', async () => {
      const { Salon } = require('../src/models');
      // Create a test salon
      const testSalon = await Salon.create({
        ownerId: owner1.id,
        name: 'Temp Salon',
        phone: '+905559999999',
        address: 'Test Cad. No:99',
        latitude: 40.9833,
        longitude: 29.0500,
        city: 'İstanbul',
        district: 'Test',
        isActive: true,
        isVerified: true,
      });

      const res = await supertest(app)
        .delete(`/api/v1/salons/${testSalon.id}`)
        .set('Authorization', `Bearer ${owner1Token}`);

      expect(res).to.equal();
      expect(res.body.data).to.have.property('message').and.include('devre dışı');

      // Verify salon is deactivated
      const updated = await Salon.findByPk(testSalon.id);
      expect(updated.isActive).to.equal(false);
    });

    it('should not return soft-deleted salon in listings', async () => {
      const res = await supertest(app)
        .get('/api/v1/salons')
        .query({ search: 'Temp' });

      expect(res).to.equal();
      expect(res.body.data.data.length).to.equal(0);
    });

    it('should return 403 when another owner tries to delete', async () => {
      const res = await supertest(app)
        .delete(`/api/v1/salons/${salon2.id}`)
        .set('Authorization', `Bearer ${owner1Token}`);

      expect(res).to.equal();
    });

    it('should allow admin to delete any salon', async () => {
      const { Salon } = require('../src/models');
      const testSalon = await Salon.create({
        ownerId: owner1.id,
        name: 'Admin Delete Test',
        phone: '+905558888888',
        address: 'Test',
        latitude: 40.9833,
        longitude: 29.0500,
        city: 'İstanbul',
        district: 'Test',
        isActive: true,
        isVerified: true,
      });

      const res = await supertest(app)
        .delete(`/api/v1/salons/${testSalon.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.equal();

      const updated = await Salon.findByPk(testSalon.id);
      expect(updated.isActive).to.equal(false);
    });
  });

  describe('PATCH /salons/:id/verify', () => {
    it('should verify a salon (admin only)', async () => {
      const { Salon } = require('../src/models');
      const unverified = await Salon.create({
        ownerId: owner1.id,
        name: 'To Verify',
        phone: '+905557777777',
        address: 'Test',
        latitude: 40.9833,
        longitude: 29.0500,
        city: 'İstanbul',
        district: 'Test',
        isActive: true,
        isVerified: false,
      });

      const res = await supertest(app)
        .patch(`/api/v1/salons/${unverified.id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.equal();
      expect(res.body.data).to.have.property('isVerified', true);

      // Clean up
      await unverified.destroy();
    });

    it('should return 404 for non-existent salon', async () => {
      const res = await supertest(app)
        .patch('/api/v1/salons/00000000-0000-0000-0000-000000000000/verify')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.equal();
    });
  });

  describe('GET /salons/owner/my-salons', () => {
    it('should return owner\'s salons', async () => {
      const res = await supertest(app)
        .get('/api/v1/salons/owner/my-salons')
        .set('Authorization', `Bearer ${owner1Token}`);

      expect(res).to.equal();
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.be.an('array');
      res.body.data.forEach(salon => {
        expect(salon.ownerId).to.equal(owner1.id);
        expect(salon.isActive).to.equal(true);
      });
    });

    it('should not include other owner\'s salons', async () => {
      const res = await supertest(app)
        .get('/api/v1/salons/owner/my-salons')
        .set('Authorization', `Bearer ${owner1Token}`);

      expect(res).to.equal();
      const salonIds = res.body.data.map(s => s.id);
      expect(salonIds).to.not.include(salon2.id);
    });
  });

  describe('Email/Phone Change OTP Flow', () => {
    it('should request email change and generate OTP', async () => {
      const res = await supertest(app)
        .post(`/api/v1/salons/${salon1.id}/request-email-change`)
        .set('Authorization', `Bearer ${owner1Token}`)
        .send({ newEmail: 'newemail@salon.com' });

      expect(res).to.equal();
      expect(res.body.data).to.have.property('message');
    });

    it('should return 400 when new email is same as current', async () => {
      const res = await supertest(app)
        .post(`/api/v1/salons/${salon1.id}/request-email-change`)
        .set('Authorization', `Bearer ${owner1Token}`)
        .send({ newEmail: salon1.email || 'info@elegance.com' });

      expect(res).to.equal();
    });

    it('should return 400 for invalid email format', async () => {
      const res = await supertest(app)
        .post(`/api/v1/salons/${salon1.id}/request-email-change`)
        .set('Authorization', `Bearer ${owner1Token}`)
        .send({ newEmail: 'not-an-email' });

      expect(res).to.equal();
    });

    it('should return 403 when another owner tries to change email', async () => {
      const res = await supertest(app)
        .post(`/api/v1/salons/${salon1.id}/request-email-change`)
        .set('Authorization', `Bearer ${owner2Token}`)
        .send({ newEmail: 'hacker@evil.com' });

      expect(res).to.equal();
    });

    it('should request phone change and generate OTP', async () => {
      const res = await supertest(app)
        .post(`/api/v1/salons/${salon1.id}/request-phone-change`)
        .set('Authorization', `Bearer ${owner1Token}`)
        .send({ newPhone: '+905551112233' });

      expect(res).to.equal();
    });

    it('should return 400 when new phone is same as current', async () => {
      const res = await supertest(app)
        .post(`/api/v1/salons/${salon1.id}/request-phone-change`)
        .set('Authorization', `Bearer ${owner1Token}`)
        .send({ newPhone: salon1.phone });

      expect(res).to.equal();
    });
  });

  describe('Confirm Email/Phone Change', () => {
    it('should confirm email change with valid OTP', async () => {
      const { Salon } = require('../src/models');
      const salon = await Salon.findByPk(salon1.id);

      // Request change
      await salon.update({
        pendingEmail: 'confirmed@email.com',
        emailChangeToken: '123456',
        emailChangeTokenExpiry: new Date(Date.now() + 600000),
      });

      const res = await supertest(app)
        .post(`/api/v1/salons/${salon.id}/confirm-email-change`)
        .set('Authorization', `Bearer ${owner1Token}`)
        .send({ token: '123456' });

      expect(res).to.equal();
      expect(res.body.data).to.have.property('message').and.include('güncellendi');

      // Verify email changed
      await salon.reload();
      expect(salon.email).to.equal('confirmed@email.com');
      expect(salon.pendingEmail).to.be.null;
      expect(salon.emailChangeToken).to.be.null;
    });

    it('should reject wrong OTP', async () => {
      const { Salon } = require('../src/models');
      const salon = await Salon.findByPk(salon1.id);
      await salon.update({
        pendingEmail: 'wrong@email.com',
        emailChangeToken: 'correct-token',
        emailChangeTokenExpiry: new Date(Date.now() + 600000),
      });

      const res = await supertest(app)
        .post(`/api/v1/salons/${salon.id}/confirm-email-change`)
        .set('Authorization', `Bearer ${owner1Token}`)
        .send({ token: 'wrong-token' });

      expect(res).to.equal();
    });

    it('should reject expired OTP', async () => {
      const { Salon } = require('../src/models');
      const salon = await Salon.findByPk(salon1.id);
      await salon.update({
        pendingEmail: 'expired@email.com',
        emailChangeToken: 'expired-token',
        emailChangeTokenExpiry: new Date(Date.now() - 60000), // 1 min ago
      });

      const res = await supertest(app)
        .post(`/api/v1/salons/${salon.id}/confirm-email-change`)
        .set('Authorization', `Bearer ${owner1Token}`)
        .send({ token: 'expired-token' });

      expect(res).to.equal();
      expect(res.body.message).to.include('dolmuş');
    });
  });
});
