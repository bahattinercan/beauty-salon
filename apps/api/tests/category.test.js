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

describe('Category API', () => {
  let data;
  let admin, customer, categories;
  let adminToken, customerToken;
  let ServiceCategory;

  before(async () => {
    await syncDB();
    data = await seedTestData();
    admin = data.users.admin;
    customer = data.users.customer;
    categories = data.categories;
    adminToken = createToken(admin);
    customerToken = createToken(customer);
    ServiceCategory = require('../src/models').ServiceCategory;
  });

  after(async () => {
    await teardownDB();
  });

  describe('GET /categories', () => {
    it('should return all categories sorted by sortOrder', async () => {
      const res = await supertest(app)
        .get('/api/v1/categories');

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data).to.be.an('array');
      expect(res.body.data.length).to.be.greaterThan(0);

      // Verify sort order
      for (let i = 0; i < res.body.data.length - 1; i++) {
        expect(res.body.data[i].sortOrder).to.be.lessThanOrEqual(res.body.data[i + 1].sortOrder);
      }
    });

    it('should return categories with correct fields', async () => {
      const res = await supertest(app)
        .get('/api/v1/categories');

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      res.body.data.forEach(cat => {
        expect(cat).to.have.property('id');
        expect(cat).to.have.property('name');
        expect(cat).to.have.property('iconName');
        expect(cat).to.have.property('sortOrder');
      });
    });

    it('should return categories without authentication', async () => {
      const res = await supertest(app)
        .get('/api/v1/categories');

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
    });
  });

  describe('POST /categories', () => {
    it('should create a new category as admin', async () => {
      const res = await supertest(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Saç Boyama',
          iconName: 'color_lens',
          sortOrder: 10,
        });

      expect(res.status).to.equal(201);
      expect(res.body.success).to.equal(true);
      expect(res.body.data.name).to.equal('Saç Boyama');
      expect(res.body.data.iconName).to.equal('color_lens');
      expect(res.body.data.sortOrder).to.equal(10);

      // Clean up
      await ServiceCategory.findByPk(res.body.data.id).then(s => s.destroy());
    });

    it('should return 400 when name is missing', async () => {
      const res = await supertest(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          iconName: 'brush',
          sortOrder: 1,
        });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.equal(false);
    });

    it('should return 400 when iconName is missing', async () => {
      const res = await supertest(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Kategori',
          sortOrder: 1,
        });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.equal(false);
    });

    it('should return 409 when category name already exists', async () => {
      const existing = categories[0];
      const res = await supertest(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: existing.name,
          iconName: 'new_icon',
          sortOrder: 99,
        });

      expect(res.status).to.equal(409);
      expect(res.body.success).to.equal(false);
    });

    it('should return 401 for unauthenticated request', async () => {
      const res = await supertest(app)
        .post('/api/v1/categories')
        .send({
          name: 'Unauthorized',
          iconName: 'star',
        });

      expect(res.status).to.equal(401);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await supertest(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Customer Cannot Create',
          iconName: 'star',
        });

      expect(res.status).to.equal(403);
    });
  });

  describe('PATCH /categories/:id', () => {
    it('should update category name as admin', async () => {
      const category = await ServiceCategory.findByPk(categories[0].id);

      const res = await supertest(app)
        .patch(`/api/v1/categories/${category.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Güncellenmiş Saç' });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data.name).to.equal('Güncellenmiş Saç');

      // Restore
      await category.update({ name: 'Saç' });
    });

    it('should update sortOrder as admin', async () => {
      const category = await ServiceCategory.findByPk(categories[0].id);

      const res = await supertest(app)
        .patch(`/api/v1/categories/${category.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sortOrder: 100 });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data.sortOrder).to.equal(100);

      // Restore
      await category.update({ sortOrder: 1 });
    });

    it('should update iconName as admin', async () => {
      const category = await ServiceCategory.findByPk(categories[0].id);

      const res = await supertest(app)
        .patch(`/api/v1/categories/${category.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ iconName: 'scissors' });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data.iconName).to.equal('scissors');

      // Restore
      await category.update({ iconName: 'content_cut' });
    });

    it('should return 404 for non-existent category', async () => {
      const res = await supertest(app)
        .patch('/api/v1/categories/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Ghost' });

      expect(res.status).to.equal(404);
      expect(res.body.success).to.equal(false);
    });

    it('should return 401 for unauthenticated request', async () => {
      const category = categories[0];
      const res = await supertest(app)
        .patch(`/api/v1/categories/${category.id}`)
        .send({ name: 'Unauthorized Update' });

      expect(res.status).to.equal(401);
    });

    it('should return 403 for non-admin user', async () => {
      const category = categories[0];
      const res = await supertest(app)
        .patch(`/api/v1/categories/${category.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'Customer Cannot Update' });

      expect(res.status).to.equal(403);
    });

    it('should return 409 when updating to an existing category name', async () => {
      // Create two temp categories: first with name A, then try to update second to name A
      const cat1 = await ServiceCategory.create({
        name: 'ConflictTestA',
        iconName: 'test',
        sortOrder: 998,
      });

      const cat2 = await ServiceCategory.create({
        name: 'ConflictTestB',
        iconName: 'test',
        sortOrder: 999,
      });

      // Now try to update cat2 to have the same name as cat1
      const res = await supertest(app)
        .patch(`/api/v1/categories/${cat2.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'ConflictTestA' });

      expect(res.status).to.equal(409);
      expect(res.body.success).to.equal(false);
      expect(res.body.message).to.include('zaten mevcut');

      // Clean up both temp categories
      await cat1.destroy();
      await cat2.destroy();
    });
  });

  describe('DELETE /categories/:id', () => {
    it('should delete a category as admin', async () => {
      // Create a temporary category to delete
      const temp = await ServiceCategory.create({
        name: 'Silinecek Kategori',
        iconName: 'delete',
        sortOrder: 999,
      });

      const res = await supertest(app)
        .delete(`/api/v1/categories/${temp.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data.message).to.include('silindi');

      // Verify it's deleted
      const deleted = await ServiceCategory.findByPk(temp.id);
      expect(deleted).to.be.null;
    });

    it('should return 404 for non-existent category', async () => {
      const res = await supertest(app)
        .delete('/api/v1/categories/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(404);
      expect(res.body.success).to.equal(false);
    });

    it('should return 401 for unauthenticated request', async () => {
      const category = categories[0];
      const res = await supertest(app)
        .delete(`/api/v1/categories/${category.id}`);

      expect(res.status).to.equal(401);
    });

    it('should return 403 for non-admin user', async () => {
      const category = categories[0];
      const res = await supertest(app)
        .delete(`/api/v1/categories/${category.id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).to.equal(403);
    });
  });

  describe('serviceCount, description ve isActive', () => {
    it('GET /categories her kategori için serviceCount döner', async () => {
      const res = await supertest(app).get('/api/v1/categories');
      expect(res.status).to.equal(200);
      res.body.data.forEach((cat) => {
        expect(cat.serviceCount).to.be.a('number');
      });
    });

    it('POST description ve isActive ile kategori oluşturur', async () => {
      const res = await supertest(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Epilasyon Test',
          iconName: 'zap',
          description: 'Lazer epilasyon hizmetleri',
          isActive: false,
          sortOrder: 3,
        });

      expect(res.status).to.equal(201);
      expect(res.body.data.description).to.equal('Lazer epilasyon hizmetleri');
      expect(res.body.data.isActive).to.equal(false);
    });

    it('PATCH isActive ve description günceller', async () => {
      const created = await supertest(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'SPA Test', iconName: 'flower' });

      const res = await supertest(app)
        .patch(`/api/v1/categories/${created.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: true, description: 'Masaj ve wellness' });

      expect(res.status).to.equal(200);
      expect(res.body.data.isActive).to.equal(true);
      expect(res.body.data.description).to.equal('Masaj ve wellness');
    });
  });

  describe('Kategori medyası (imageUrl / videoUrl)', () => {
    it('POST imageUrl ve videoUrl ile kategori oluşturur', async () => {
      const res = await supertest(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Medya Test Kategorisi',
          iconName: 'image',
          sortOrder: 42,
          imageUrl: '/uploads/kategori.png',
          videoUrl: '/uploads/kategori.mp4',
        });

      expect(res.status).to.equal(201);
      expect(res.body.success).to.equal(true);
      expect(res.body.data.imageUrl).to.equal('/uploads/kategori.png');
      expect(res.body.data.videoUrl).to.equal('/uploads/kategori.mp4');

      const stored = await ServiceCategory.findByPk(res.body.data.id);
      expect(stored.imageUrl).to.equal('/uploads/kategori.png');
      expect(stored.videoUrl).to.equal('/uploads/kategori.mp4');

      await stored.destroy();
    });

    it('POST medya alanları verilmezse null kalır', async () => {
      const res = await supertest(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Medyasız Kategori', iconName: 'block' });

      expect(res.status).to.equal(201);
      expect(res.body.data.imageUrl).to.be.null;
      expect(res.body.data.videoUrl).to.be.null;

      await ServiceCategory.findByPk(res.body.data.id).then((s) => s.destroy());
    });

    it('PATCH imageUrl ve videoUrl günceller', async () => {
      const category = await ServiceCategory.create({
        name: 'Medya Güncelleme Kategorisi',
        iconName: 'edit',
        sortOrder: 43,
      });

      const res = await supertest(app)
        .patch(`/api/v1/categories/${category.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ imageUrl: '/uploads/yeni.png', videoUrl: '/uploads/yeni.webm' });

      expect(res.status).to.equal(200);
      expect(res.body.data.imageUrl).to.equal('/uploads/yeni.png');
      expect(res.body.data.videoUrl).to.equal('/uploads/yeni.webm');

      await category.destroy();
    });

    it('PATCH null ile medya alanlarını temizler', async () => {
      const category = await ServiceCategory.create({
        name: 'Medya Temizleme Kategorisi',
        iconName: 'delete_sweep',
        sortOrder: 44,
        imageUrl: '/uploads/silinecek.png',
        videoUrl: '/uploads/silinecek.mp4',
      });

      const res = await supertest(app)
        .patch(`/api/v1/categories/${category.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ imageUrl: null, videoUrl: null });

      expect(res.status).to.equal(200);
      expect(res.body.data.imageUrl).to.be.null;
      expect(res.body.data.videoUrl).to.be.null;

      const stored = await ServiceCategory.findByPk(category.id);
      expect(stored.imageUrl).to.be.null;
      expect(stored.videoUrl).to.be.null;

      await stored.destroy();
    });

    it('PATCH medya alanlarına dokunmazsa mevcut değerler korunur', async () => {
      const category = await ServiceCategory.create({
        name: 'Medya Koruma Kategorisi',
        iconName: 'lock',
        sortOrder: 45,
        imageUrl: '/uploads/korunan.png',
        videoUrl: '/uploads/korunan.mp4',
      });

      const res = await supertest(app)
        .patch(`/api/v1/categories/${category.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Sadece açıklama güncellendi' });

      expect(res.status).to.equal(200);
      expect(res.body.data.imageUrl).to.equal('/uploads/korunan.png');
      expect(res.body.data.videoUrl).to.equal('/uploads/korunan.mp4');

      await category.destroy();
    });
  });
});
