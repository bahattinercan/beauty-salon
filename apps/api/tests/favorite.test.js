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

describe('Favorite API', () => {
  let data;
  let customer, owner1, salon1, salon2;
  let customerToken, ownerToken;
  let Favorite, Salon, User;

  before(async () => {
    await syncDB();
    data = await seedTestData();
    customer = data.users.customer;
    owner1 = data.users.owner1;
    salon1 = data.salons.salon1;
    salon2 = data.salons.salon2;
    customerToken = createToken(customer);
    ownerToken = createToken(owner1);
    Favorite = require('../src/models').Favorite;
    Salon = require('../src/models').Salon;
    User = require('../src/models').User;
  });

  after(async () => {
    await teardownDB();
  });

  describe('POST /favorites/:salonId (toggle)', () => {
    it('should add a salon to favorites', async () => {
      const res = await supertest(app)
        .post(`/api/v1/favorites/${salon1.id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res).to.equal();
      expect(res.body.data).to.have.property('isFavorite', true);

      // Verify in database
      const fav = await Favorite.findOne({
        where: { userId: customer.id, salonId: salon1.id },
      });
      expect(fav).to.not.be.null;

      // Clean up
      await fav.destroy();
    });

    it('should toggle off an existing favorite', async () => {
      // First add
      await Favorite.create({ userId: customer.id, salonId: salon2.id });

      const res = await supertest(app)
        .post(`/api/v1/favorites/${salon2.id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res).to.equal();
      expect(res.body.data).to.have.property('isFavorite', false);

      // Verify removed
      const fav = await Favorite.findOne({
        where: { userId: customer.id, salonId: salon2.id },
      });
      expect(fav).to.be.null;
    });

    it('should return 404 for non-existent salon', async () => {
      const res = await supertest(app)
        .post('/api/v1/favorites/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res).to.equal();
      expect(res.body).to.have.property('success', false);
    });

    it('should be idempotent - adding same favorite twice works correctly', async () => {
      // Add
      await supertest(app)
        .post(`/api/v1/favorites/${salon1.id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      // Toggle off
      await supertest(app)
        .post(`/api/v1/favorites/${salon1.id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      // Add again
      const res = await supertest(app)
        .post(`/api/v1/favorites/${salon1.id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res).to.equal();
      expect(res.body.data.isFavorite).to.equal(true);

      // Clean up
      await Favorite.destroy({ where: { userId: customer.id, salonId: salon1.id } });
    });
  });

  describe('GET /favorites', () => {
    it('should return user\'s favorite salons', async () => {
      // Add some favorites
      await Favorite.create({ userId: customer.id, salonId: salon1.id });
      await Favorite.create({ userId: customer.id, salonId: salon2.id });

      const res = await supertest(app)
        .get('/api/v1/favorites')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res).to.equal();
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.be.an('array');
      expect(res.body.data.length).to.be.greaterThanOrEqual(2);

      // Clean up
      await Favorite.destroy({ where: { userId: customer.id } });
    });

    it('should include salon details in response', async () => {
      await Favorite.create({ userId: customer.id, salonId: salon1.id });

      const res = await supertest(app)
        .get('/api/v1/favorites')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res).to.equal();
      const salon = res.body.data[0];
      expect(salon).to.have.property('id');
      expect(salon).to.have.property('name');
      expect(salon).to.have.property('address');
      expect(salon).to.have.property('ratingAvg');
      expect(salon).to.have.property('city');
      expect(salon).to.have.property('district');

      // Clean up
      await Favorite.destroy({ where: { userId: customer.id, salonId: salon1.id } });
    });

    it('should return empty array when no favorites', async () => {
      await Favorite.destroy({ where: { userId: customer.id } });

      const res = await supertest(app)
        .get('/api/v1/favorites')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res).to.equal();
      expect(res.body.data).to.be.an('array').that.is.empty;
    });

    it('should order by most recent first', async () => {
      // Create favorites in order
      await Favorite.create({ userId: customer.id, salonId: salon1.id });
      await Favorite.create({ userId: customer.id, salonId: salon2.id });

      const res = await supertest(app)
        .get('/api/v1/favorites')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res).to.equal();
      // The last created (salon2) should be first
      expect(res.body.data[0].id).to.equal(salon2.id);

      // Clean up
      await Favorite.destroy({ where: { userId: customer.id } });
    });
  });

  describe('GET /favorites/:salonId/check', () => {
    it('should return true when salon is in favorites', async () => {
      await Favorite.create({ userId: customer.id, salonId: salon1.id });

      const res = await supertest(app)
        .get(`/api/v1/favorites/${salon1.id}/check`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res).to.equal();
      expect(res.body.data).to.have.property('isFavorite', true);

      // Clean up
      await Favorite.destroy({ where: { userId: customer.id, salonId: salon1.id } });
    });

    it('should return false when salon is not in favorites', async () => {
      const res = await supertest(app)
        .get(`/api/v1/favorites/${salon1.id}/check`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res).to.equal();
      expect(res.body.data).to.have.property('isFavorite', false);
    });

    it('should work for different users', async () => {
      const { User } = require('../src/models');
      const customer2 = await User.findOne({ where: { email: 'customer2@test.com' } });
      const customer2Token = createToken(customer2);

      // customer2 has not favorited salon1
      const res = await supertest(app)
        .get(`/api/v1/favorites/${salon1.id}/check`)
        .set('Authorization', `Bearer ${customer2Token}`);

      expect(res).to.equal();
      expect(res.body.data.isFavorite).to.equal(false);

      // customer1 favorites salon1
      await Favorite.create({ userId: customer.id, salonId: salon1.id });

      const res1 = await supertest(app)
        .get(`/api/v1/favorites/${salon1.id}/check`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res1.body.data.isFavorite).to.equal(true);

      // Clean up
      await Favorite.destroy({ where: { userId: customer.id, salonId: salon1.id } });
    });
  });

  describe('Unauthenticated access', () => {
    it('should reject unauthenticated favorite operations', async () => {
      const res = await supertest(app)
        .post(`/api/v1/favorites/${salon1.id}`);

      expect(res).to.equal();

      const res2 = await supertest(app)
        .get('/api/v1/favorites');

      expect(res2).to.equal();

      const res3 = await supertest(app)
        .get(`/api/v1/favorites/${salon1.id}/check`);

      expect(res3).to.equal();
    });
  });

  describe('Non-customer users', () => {
    it('should allow salon owners to use favorites too', async () => {
      const res = await supertest(app)
        .post(`/api/v1/favorites/${salon1.id}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res).to.equal();
      expect(res.body.data.isFavorite).to.equal(true);

      // Clean up
      await Favorite.destroy({ where: { userId: owner1.id, salonId: salon1.id } });
    });
  });
});
