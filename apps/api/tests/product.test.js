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

describe('Product API', () => {
  let data;
  let owner1, owner2, customer, salon1, salon2;
  let owner1Token, owner2Token, adminToken;
  let Product;

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
    adminToken = createToken(data.users.admin);
    Product = require('../src/models').Product;
  });

  after(async () => {
    await teardownDB();
  });

  // ==================== GET /salons/:salonId/products ====================

  describe('GET /salons/:salonId/products', () => {
    it('should return active products for a salon', async () => {
      const res = await supertest(app)
        .get(`/api/v1/salons/${salon1.id}/products`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data).to.be.an('array');
    });

    it('should return empty array when salon has no products', async () => {
      const res = await supertest(app)
        .get(`/api/v1/salons/${salon2.id}/products`);

      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
      expect(res.body.data.length).to.equal(0);
    });

    it('should filter products by search term', async () => {
      // Create a test product
      const product = await Product.create({
        salonId: salon1.id,
        name: 'Premium Saç Bakım Ürünü',
        price: 150,
        category: 'bakim',
      });

      const res = await supertest(app)
        .get(`/api/v1/salons/${salon1.id}/products`)
        .query({ search: 'Premium' });

      expect(res.status).to.equal(200);
      expect(res.body.data.length).to.be.greaterThan(0);
      expect(res.body.data[0].name).to.include('Premium');

      await product.destroy();
    });

    it('should filter by category', async () => {
      const product = await Product.create({
        salonId: salon1.id,
        name: 'Test Ürün',
        price: 100,
        category: 'test-category',
      });

      const res = await supertest(app)
        .get(`/api/v1/salons/${salon1.id}/products`)
        .query({ category: 'test-category' });

      expect(res.status).to.equal(200);
      expect(res.body.data.length).to.be.greaterThan(0);
      expect(res.body.data[0].category).to.equal('test-category');

      await product.destroy();
    });

    it('should sort by price ascending when sortBy=price', async () => {
      const product1 = await Product.create({ salonId: salon1.id, name: 'Cheap', price: 50 });
      const product2 = await Product.create({ salonId: salon1.id, name: 'Expensive', price: 500 });

      const res = await supertest(app)
        .get(`/api/v1/salons/${salon1.id}/products`)
        .query({ sortBy: 'price' });

      expect(res.status).to.equal(200);
      expect(res.body.data[0].price).to.be.lessThan(res.body.data[1].price);

      await product1.destroy();
      await product2.destroy();
    });

    it('should sort by createdAt DESC by default', async () => {
      await Product.create({ salonId: salon1.id, name: 'Older', price: 100 });
      const latest = await Product.create({ salonId: salon1.id, name: 'Newest', price: 200 });

      const res = await supertest(app)
        .get(`/api/v1/salons/${salon1.id}/products`);

      expect(res.status).to.equal(200);
      expect(res.body.data[0].id).to.equal(latest.id);

      await latest.destroy();
    });

    it('should not return inactive products', async () => {
      const product = await Product.create({
        salonId: salon1.id,
        name: 'Inactive Product',
        price: 100,
        isActive: false,
      });

      const res = await supertest(app)
        .get(`/api/v1/salons/${salon1.id}/products`);

      expect(res.status).to.equal(200);
      const ids = res.body.data.map(p => p.id);
      expect(ids).to.not.include(product.id);

      await product.destroy();
    });
  });

  // ==================== GET /products/:id ====================

  describe('GET /products/:id', () => {
    it('should return a product by id', async () => {
      const product = await Product.create({
        salonId: salon1.id,
        name: 'Findable Product',
        price: 200,
        category: 'test',
      });

      const res = await supertest(app)
        .get(`/api/v1/products/${product.id}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data.name).to.equal('Findable Product');

      await product.destroy();
    });

    it('should return 404 for non-existent product', async () => {
      const res = await supertest(app)
        .get('/api/v1/products/00000000-0000-0000-0000-000000000000');

      expect(res.status).to.equal(404);
      expect(res.body.success).to.equal(false);
    });

    it('should return products regardless of isActive status', async () => {
      const inactive = await Product.create({
        salonId: salon1.id,
        name: 'Inactive But Fetchable',
        price: 50,
        isActive: false,
      });

      const res = await supertest(app)
        .get(`/api/v1/products/${inactive.id}`);

      expect(res.status).to.equal(200);
      expect(res.body.data.id).to.equal(inactive.id);

      await inactive.destroy();
    });
  });

  // ==================== POST /salons/:salonId/products ====================

  describe('POST /salons/:salonId/products', () => {
    it('should create a product for authenticated owner', async () => {
      const res = await supertest(app)
        .post(`/api/v1/salons/${salon1.id}/products`)
        .set('Authorization', `Bearer ${owner1Token}`)
        .send({
          name: 'Yeni Ürün',
          description: 'Test açıklaması',
          price: 250,
          stockQuantity: 10,
          category: 'bakim',
        });

      expect(res.status).to.equal(201);
      expect(res.body.success).to.equal(true);
      expect(res.body.data.name).to.equal('Yeni Ürün');
      expect(res.body.data.salonId).to.equal(salon1.id);

      await Product.findByPk(res.body.data.id).then(p => p.destroy());
    });

    it('should return 403 when another owner tries to create', async () => {
      const res = await supertest(app)
        .post(`/api/v1/salons/${salon1.id}/products`)
        .set('Authorization', `Bearer ${owner2Token}`)
        .send({
          name: 'Hacked Product',
          price: 100,
        });

      expect(res.status).to.equal(403);
      expect(res.body.success).to.equal(false);
    });

    it('should return 401 for unauthenticated request', async () => {
      const res = await supertest(app)
        .post(`/api/v1/salons/${salon1.id}/products`)
        .send({ name: 'No Auth', price: 100 });

      expect(res.status).to.equal(401);
    });

    it('should return 403 when customer tries to create', async () => {
      const customerToken = createToken(customer);
      const res = await supertest(app)
        .post(`/api/v1/salons/${salon1.id}/products`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'Customer Product', price: 100 });

      expect(res.status).to.equal(403);
    });

    it('should create product with salonId bound to the salon owner', async () => {
      const res = await supertest(app)
        .post(`/api/v1/salons/${salon1.id}/products`)
        .set('Authorization', `Bearer ${owner1Token}`)
        .send({
          name: 'Auto SalonId Product',
          price: 50,
        });

      expect(res.status).to.equal(201);
      expect(res.body.data.salonId).to.equal(salon1.id);

      await Product.findByPk(res.body.data.id).then(p => p.destroy());
    });
  });

  // ==================== PATCH /products/:id ====================

  describe('PATCH /products/:id', () => {
    it('should allow owner to update their product', async () => {
      const product = await Product.create({
        salonId: salon1.id,
        name: 'Original Name',
        price: 100,
      });

      const res = await supertest(app)
        .patch(`/api/v1/products/${product.id}`)
        .set('Authorization', `Bearer ${owner1Token}`)
        .send({ name: 'Updated Name', price: 200 });

      expect(res.status).to.equal(200);
      expect(res.body.data.name).to.equal('Updated Name');
      expect(res.body.data.price).to.equal(200);

      await product.destroy();
    });

    it('should return 403 when another owner tries to update', async () => {
      const product = await Product.create({
        salonId: salon1.id,
        name: 'Other Owner Target',
        price: 100,
      });

      const res = await supertest(app)
        .patch(`/api/v1/products/${product.id}`)
        .set('Authorization', `Bearer ${owner2Token}`)
        .send({ name: 'Hacked' });

      expect(res.status).to.equal(403);

      await product.destroy();
    });

    it('should return 404 for non-existent product', async () => {
      const res = await supertest(app)
        .patch('/api/v1/products/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${owner1Token}`);

      expect(res.status).to.equal(404);
    });

    it('should allow partial update', async () => {
      const product = await Product.create({
        salonId: salon1.id,
        name: 'Full Product',
        price: 100,
        stockQuantity: 5,
      });

      const res = await supertest(app)
        .patch(`/api/v1/products/${product.id}`)
        .set('Authorization', `Bearer ${owner1Token}`)
        .send({ price: 150 });

      expect(res.status).to.equal(200);
      expect(res.body.data.price).to.equal(150);
      expect(res.body.data.name).to.equal('Full Product'); // unchanged

      await product.destroy();
    });
  });

  // ==================== DELETE /products/:id ====================

  describe('DELETE /products/:id (soft delete)', () => {
    it('should soft delete the product (set isActive: false)', async () => {
      const product = await Product.create({
        salonId: salon1.id,
        name: 'To Delete',
        price: 100,
        isActive: true,
      });

      const res = await supertest(app)
        .delete(`/api/v1/products/${product.id}`)
        .set('Authorization', `Bearer ${owner1Token}`);

      expect(res.status).to.equal(200);
      expect(res.body.data.message).to.include('devre dışı');

      // Verify soft delete
      const updated = await Product.findByPk(product.id);
      expect(updated.isActive).to.equal(false);
    });

    it('should not return soft-deleted product in salon listing', async () => {
      const product = await Product.create({
        salonId: salon1.id,
        name: 'Deleted In Listing',
        price: 50,
        isActive: true,
      });

      const deleteRes = await supertest(app)
        .delete(`/api/v1/products/${product.id}`)
        .set('Authorization', `Bearer ${owner1Token}`);

      expect(deleteRes.status).to.equal(200);

      const listRes = await supertest(app)
        .get(`/api/v1/salons/${salon1.id}/products`);

      const ids = listRes.body.data.map(p => p.id);
      expect(ids).to.not.include(product.id);
    });

    it('should return 403 when another owner tries to delete', async () => {
      const product = await Product.create({
        salonId: salon1.id,
        name: 'Protected Product',
        price: 100,
      });

      const res = await supertest(app)
        .delete(`/api/v1/products/${product.id}`)
        .set('Authorization', `Bearer ${owner2Token}`);

      expect(res.status).to.equal(403);

      await product.destroy();
    });

    it('should return 404 for non-existent product', async () => {
      const res = await supertest(app)
        .delete('/api/v1/products/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${owner1Token}`);

      expect(res.status).to.equal(404);
    });
  });
});
