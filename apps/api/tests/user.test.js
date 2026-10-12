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

describe('User API', () => {
  let data;
  let customer, admin;
  let customerToken, adminToken;
  let User;

  before(async () => {
    await syncDB();
    data = await seedTestData();
    customer = data.users.customer;
    admin = data.users.admin;
    customerToken = createToken(customer);
    adminToken = createToken(admin);
    User = require('../src/models').User;
  });

  after(async () => {
    await teardownDB();
  });

  describe('GET /users/me', () => {
    it('should return the authenticated user\'s profile', async () => {
      const res = await supertest(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res).to.equal();
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('id', customer.id);
      expect(res.body.data).to.have.property('email', customer.email);
      expect(res.body.data).to.have.property('fullName', customer.fullName);
      expect(res.body.data).to.have.property('role', 'CUSTOMER');
      // Should not contain sensitive fields
      expect(res.body.data).to.not.have.property('passwordHash');
      expect(res.body.data).to.not.have.property('refreshToken');
    });

    it('should return 401 for unauthenticated request', async () => {
      const res = await supertest(app)
        .get('/api/v1/users/me');

      expect(res).to.equal();
    });

    it('should return different profiles for different users', async () => {
      const customer2 = data.users.customer2;
      const customer2Token = createToken(customer2);

      const res1 = await supertest(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${customerToken}`);

      const res2 = await supertest(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${customer2Token}`);

      expect(res1.body.data.email).to.not.equal(res2.body.data.email);
      expect(res1.body.data.fullName).to.not.equal(res2.body.data.fullName);
    });
  });

  describe('PATCH /users/me', () => {
    it('should update fullName', async () => {
      const res = await supertest(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ fullName: 'Updated Name' });

      expect(res).to.equal();
      expect(res.body.data.fullName).to.equal('Updated Name');

      // Restore
      customer.fullName = 'Zeynep Kaya';
      await customer.save();
    });

    it('should update phone', async () => {
      const res = await supertest(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ phone: '+905559999999' });

      expect(res).to.equal();
      expect(res.body.data.phone).to.equal('+905559999999');

      // Restore
      customer.phone = '+905339876543';
      await customer.save();
    });

    it('should update avatarUrl', async () => {
      const res = await supertest(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ avatarUrl: 'https://example.com/avatar.jpg' });

      expect(res).to.equal();
      expect(res.body.data.avatarUrl).to.equal('https://example.com/avatar.jpg');

      // Restore
      customer.avatarUrl = null;
      await customer.save();
    });

    it('should update multiple fields at once', async () => {
      const res = await supertest(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          fullName: 'Multi Update',
          phone: '+905551112233',
        });

      expect(res).to.equal();
      expect(res.body.data.fullName).to.equal('Multi Update');
      expect(res.body.data.phone).to.equal('+905551112233');

      // Restore
      customer.fullName = 'Zeynep Kaya';
      customer.phone = '+905339876543';
      await customer.save();
    });

    it('should return 409 when phone is already taken', async () => {
      const customer2 = data.users.customer2;
      const customer2Token = createToken(customer2);

      const res = await supertest(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ phone: customer2.phone });

      expect(res).to.equal();
    });

    it('should not allow changing email through this endpoint', async () => {
      const res = await supertest(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ email: 'hacked@evil.com' });

      expect(res).to.equal(); // Endpoint doesn't block it, but it should just ignore
      // Email should remain unchanged
      const me = await supertest(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(me.body.data.email).to.equal(customer.email);
    });
  });

  describe('GET /users (Admin)', () => {
    it('should return paginated list of all users (admin only)', async () => {
      const res = await supertest(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.equal();
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('data');
      expect(res.body.data).to.have.property('meta');
      expect(res.body.data.meta).to.have.property('total');
      expect(res.body.data.data.length).to.be.greaterThan(0);
    });

    it('should support pagination', async () => {
      const res1 = await supertest(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 2 });

      const res2 = await supertest(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 2, limit: 2 });

      expect(res1.body.data.meta.totalPages).to.be.greaterThan(1);
      expect(res1.body.data.data.length).to.be.lessThanOrEqual(2);
    });

    it('should not include sensitive fields in response', async () => {
      const res = await supertest(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.equal();
      res.body.data.data.forEach(user => {
        expect(user).to.not.have.property('passwordHash');
        expect(user).to.not.have.property('refreshToken');
        expect(user).to.not.have.property('passwordResetToken');
      });
    });

    it('should return 403 for non-admin users', async () => {
      const res = await supertest(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res).to.equal();
    });

    it('should return 401 for unauthenticated requests', async () => {
      const res = await supertest(app)
        .get('/api/v1/users');

      expect(res).to.equal();
    });
  });

  describe('PATCH /users/:id/toggle-active (Admin)', () => {
    it('should deactivate a user', async () => {
      const customer2 = data.users.customer2;

      const res = await supertest(app)
        .patch(`/api/v1/users/${customer2.id}/toggle-active`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.equal();
      expect(res.body.data).to.have.property('isActive', false);

      // Verify
      await customer2.reload();
      expect(customer2.isActive).to.equal(false);

      // Reactivate
      await customer2.update({ isActive: true });
    });

    it('should reactivate a user', async () => {
      const customer2 = data.users.customer2;
      await customer2.update({ isActive: false });

      const res = await supertest(app)
        .patch(`/api/v1/users/${customer2.id}/toggle-active`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.equal();
      expect(res.body.data.isActive).to.equal(true);

      // Verify
      await customer2.reload();
      expect(customer2.isActive).to.equal(true);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await supertest(app)
        .patch('/api/v1/users/00000000-0000-0000-0000-000000000000/toggle-active')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.equal();
    });

    it('should return 403 for non-admin users', async () => {
      const res = await supertest(app)
        .patch(`/api/v1/users/${customer.id}/toggle-active`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res).to.equal();
    });

    it('should allow users to toggle their own active status', async () => {
      // Users should be able to deactivate themselves (edge case)
      const res = await supertest(app)
        .patch(`/api/v1/users/${customer.id}/toggle-active`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res).to.equal(); // Still admin-only
    });
  });

  describe('Role-based access', () => {
    it('should allow admin to access admin-only endpoints', async () => {
      const res = await supertest(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res).to.equal();
    });

    it('should block salon owner from admin endpoints', async () => {
      const owner = data.users.owner1;
      const ownerToken = createToken(owner);

      const res = await supertest(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res).to.equal();
    });

    it('should block customer from admin endpoints', async () => {
      const res = await supertest(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res).to.equal();
    });
  });

  describe('Session isolation', () => {
    it('should not leak user data between sessions', async () => {
      const customer2 = data.users.customer2;
      const customer2Token = createToken(customer2);

      const res1 = await supertest(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${customerToken}`);

      const res2 = await supertest(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${customer2Token}`);

      // Data should be completely different
      expect(res1.body.data.email).to.not.equal(res2.body.data.email);
      expect(res1.body.data.fullName).to.not.equal(res2.body.data.fullName);
      expect(res1.body.data.id).to.not.equal(res2.body.data.id);
    });
  });
});
