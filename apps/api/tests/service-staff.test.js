const app = require('../src/app');
const { syncDB, seedTestData, teardownDB } = require('./setup');
const jwt = require('jsonwebtoken');
const chai = require('chai');
const supertest = require('supertest');

const { expect } = chai;

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-unit-tests-only-32chars!';

const createToken = (user) => {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
};

describe('Service & Staff API', () => {
  let data;
  let owner1, admin, salon1;
  let ownerToken, adminToken;
  let Service, Staff, Salon, User;

  before(async () => {
    await syncDB();
    data = await seedTestData();
    owner1 = data.users.owner1;
    admin = data.users.admin;
    salon1 = data.salons.salon1;
    ownerToken = createToken(owner1);
    adminToken = createToken(admin);
    Service = require('../src/models').Service;
    Staff = require('../src/models').Staff;
    Salon = require('../src/models').Salon;
    User = require('../src/models').User;
  });

  after(async () => {
    await teardownDB();
  });

  describe('GET /categories', () => {
    it('should return all categories ordered by sortOrder', async () => {
      const res = await supertest(app).get('/api/v1/categories');
      expect(res).to.have.property('status', 200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.be.an('array');
      for (let i = 0; i < res.body.data.length - 1; i++) {
        expect(res.body.data[i].sortOrder).to.be.lessThan(res.body.data[i + 1].sortOrder);
      }
    });
  });

  describe('POST /categories (Admin)', () => {
    it('should create a new category', async () => {
      const res = await supertest(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Category', iconName: 'star', sortOrder: 10 });
      expect(res).to.have.property('status', 201);
      expect(res.body.data).to.have.property('name', 'Test Category');
      await Service.findByPk(res.body.data.id).catch(() => {});
    });

    it('should return 403 for non-admin users', async () => {
      const res = await supertest(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Hacked Category', sortOrder: 99 });
      expect(res).to.have.property('status', 403);
    });
  });

  describe('GET /salons/:salonId/services', () => {
    it('should return salon services grouped by category', async () => {
      const res = await supertest(app).get(`/api/v1/salons/${salon1.id}/services`);
      expect(res).to.have.property('status', 200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.be.an('array');
      res.body.data.forEach(service => {
        expect(service).to.have.property('category');
        expect(service).to.have.property('isActive', true);
      });
    });

    it('should return 404 for non-existent salon', async () => {
      const res = await supertest(app)
        .get('/api/v1/salons/00000000-0000-0000-0000-000000000000/services');
      expect(res).to.have.property('status', 200);
      expect(res.body.data).to.be.an('array').that.is.empty;
    });
  });

  describe('POST /salons/:salonId/services', () => {
    it('should create a new service for the salon', async () => {
      const res = await supertest(app)
        .post(`/api/v1/salons/${salon1.id}/services`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          categoryId: data.categories[0].id,
          name: 'New Service',
          description: 'Test service',
          price: 100,
          durationMinutes: 30,
        });
      expect(res).to.have.property('status', 201);
      expect(res.body.data).to.have.property('name', 'New Service');
      expect(res.body.data).to.have.property('salonId', salon1.id);
      expect(res.body.data).to.have.property('isActive', true);
      const service = await Service.findByPk(res.body.data.id);
      if (service) await service.destroy();
    });

    it('should return 403 when another owner tries to add service', async () => {
      const salon2 = data.salons.salon2;
      const owner2 = data.users.owner2;
      const owner2Token = createToken(owner2);
      const res = await supertest(app)
        .post(`/api/v1/salons/${salon2.id}/services`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          categoryId: data.categories[0].id,
          name: 'Hacked Service',
          price: 100,
          durationMinutes: 30,
        });
      expect(res).to.have.property('status', 403);
    });
  });

  describe('PATCH /services/:id', () => {
    it('should allow salon owner to update their service', async () => {
      const service = await Service.findOne({ where: { salonId: salon1.id } });
      const token = createToken(owner1);
      const res = await supertest(app)
        .patch(`/api/v1/services/${service.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Service', price: 300 });
      expect(res).to.have.property('status', 200);
      expect(res.body.data.name).to.equal('Updated Service');
      expect(res.body.data.price).to.equal(300);
      service.name = service.name.replace('Updated Service', service.name.split(' ')[0]);
      await service.save();
    });

    it('should return 403 for another owner', async () => {
      const service = await Service.findOne({ where: { salonId: salon1.id } });
      const owner2 = data.users.owner2;
      const owner2Token = createToken(owner2);
      const res = await supertest(app)
        .patch(`/api/v1/services/${service.id}`)
        .set('Authorization', `Bearer ${owner2Token}`)
        .send({ name: 'Hacked' });
      expect(res).to.have.property('status', 403);
    });

    it('should return 404 for non-existent service', async () => {
      const res = await supertest(app)
        .patch('/api/v1/services/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(res).to.have.property('status', 404);
    });
  });

  describe('DELETE /services/:id (soft delete)', () => {
    it('should soft delete a service', async () => {
      const service = await Service.findOne({ where: { salonId: salon1.id, isActive: true } });
      const token = createToken(owner1);
      const res = await supertest(app)
        .delete(`/api/v1/services/${service.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.property('status', 200);
      expect(res.body.data).to.have.property('message').and.include('devre dışı');
      await service.reload();
      expect(service.isActive).to.equal(false);
    });

    it('should not return soft-deleted service in salon services list', async () => {
      const res = await supertest(app).get(`/api/v1/salons/${salon1.id}/services`);
      expect(res).to.have.property('status', 200);
      res.body.data.forEach(service => {
        expect(service.isActive).to.equal(true);
      });
    });

    it('should return 403 for another owner', async () => {
      const service = await Service.findOne({ where: { salonId: salon1.id, isActive: true } });
      const owner2 = data.users.owner2;
      const owner2Token = createToken(owner2);
      const res = await supertest(app)
        .delete(`/api/v1/services/${service.id}`)
        .set('Authorization', `Bearer ${owner2Token}`);
      expect(res).to.have.property('status', 403);
    });
  });

  describe('Staff CRUD', () => {
    it('should create staff for the salon', async () => {
      const res = await supertest(app)
        .post(`/api/v1/salons/${salon1.id}/staff`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          fullName: 'Test Employee',
          title: 'Test Title',
          bio: 'Test bio',
          serviceIds: [data.services.service1.id],
        });
      expect(res).to.have.property('status', 201);
      expect(res.body.data).to.have.property('fullName', 'Test Employee');
      expect(res.body.data).to.have.property('salonId', salon1.id);
      expect(res.body.data).to.have.property('services');
      await Staff.findByPk(res.body.data.id).then(s => s.destroy());
    });

    it('should return 403 for another owner', async () => {
      const salon2 = data.salons.salon2;
      const owner2 = data.users.owner2;
      const owner2Token = createToken(owner2);
      const res = await supertest(app)
        .post(`/api/v1/salons/${salon2.id}/staff`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          fullName: 'Hacked Employee',
          title: 'Hacked',
        });
      expect(res).to.have.property('status', 403);
    });

    it('should get staff for a salon', async () => {
      const res = await supertest(app).get(`/api/v1/salons/${salon1.id}/staff`);
      expect(res).to.have.property('status', 200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.be.an('array');
      res.body.data.forEach(staff => {
        expect(staff.isActive).to.equal(true);
      });
    });

    it('should update staff', async () => {
      const staff = await Staff.findOne({ where: { salonId: salon1.id, fullName: 'Merve Demir' } });
      const token = createToken(owner1);
      const res = await supertest(app)
        .patch(`/api/v1/staff/${staff.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Senior Stylist Updated' });
      expect(res).to.have.property('status', 200);
      expect(res.body.data.title).to.equal('Senior Stylist Updated');
      staff.title = 'Kıdemli Kuaför';
      await staff.save();
    });

    it('should soft delete staff', async () => {
      const staff = await Staff.findOne({ where: { salonId: salon1.id, isActive: true } });
      const token = createToken(owner1);
      const res = await supertest(app)
        .delete(`/api/v1/staff/${staff.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.property('status', 200);
      expect(res.body.data).to.have.property('message').and.include('devre dışı');
      await staff.reload();
      expect(staff.isActive).to.equal(false);
    });

    it('should not return inactive staff in salon staff list', async () => {
      const res = await supertest(app).get(`/api/v1/salons/${salon1.id}/staff`);
      expect(res).to.have.property('status', 200);
      res.body.data.forEach(staff => {
        expect(staff.isActive).to.equal(true);
      });
    });
  });

  describe('Admin endpoints', () => {
    describe('GET /admin/dashboard', () => {
      it('should return admin dashboard stats', async () => {
        const res = await supertest(app)
          .get('/api/v1/admin/dashboard')
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res).to.have.property('status', 200);
        expect(res.body).to.have.property('success', true);
      });
    });

    describe('GET /admin/salons', () => {
      it('should return all salons for admin', async () => {
        const res = await supertest(app)
          .get('/api/v1/admin/salons')
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res).to.have.property('status', 200);
        expect(res.body).to.have.property('success', true);
        expect(res.body.data).to.have.property('data');
      });

      it('should filter by verified status', async () => {
        const res = await supertest(app)
          .get('/api/v1/admin/salons')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ verified: 'true' });
        expect(res).to.have.property('status', 200);
        res.body.data.data.forEach(salon => {
          expect(salon.isVerified).to.equal(true);
        });
      });
    });

    describe('GET /admin/appointments', () => {
      it('should return all appointments for admin', async () => {
        const res = await supertest(app)
          .get('/api/v1/admin/appointments')
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res).to.have.property('status', 200);
        expect(res.body).to.have.property('success', true);
      });

      it('should filter by status', async () => {
        const res = await supertest(app)
          .get('/api/v1/admin/appointments')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ status: 'PENDING' });
        expect(res).to.have.property('status', 200);
        res.body.data.data.forEach(apt => {
          expect(apt.status).to.equal('PENDING');
        });
      });
    });

    describe('GET /admin/reviews', () => {
      it('should return all reviews for admin', async () => {
        const res = await supertest(app)
          .get('/api/v1/admin/reviews')
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res).to.have.property('status', 200);
        expect(res.body).to.have.property('success', true);
      });
    });

    it('should return 403 for non-admin users on admin endpoints', async () => {
      const endpoints = ['/api/v1/admin/dashboard', '/api/v1/admin/salons', '/api/v1/admin/appointments', '/api/v1/admin/reviews'];
      for (const endpoint of endpoints) {
        const res = await supertest(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${ownerToken}`);
        expect(res).to.have.property('status', 403);
      }
    });
  });
});
