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

describe('Notification API', () => {
  let data;
  let owner1, owner2, customer, admin;
  let owner1Token, customerToken, adminToken;
  let Notification;

  before(async () => {
    await syncDB();
    data = await seedTestData();
    owner1 = data.users.owner1;
    owner2 = data.users.owner2;
    customer = data.users.customer;
    admin = data.users.admin;
    owner1Token = createToken(owner1);
    customerToken = createToken(customer);
    adminToken = createToken(admin);
    Notification = require('../src/models').Notification;
  });

  after(async () => {
    await teardownDB();
  });

  // ==================== GET /notifications ====================

  describe('GET /notifications', () => {
    it('should return 401 for unauthenticated request', async () => {
      const res = await supertest(app)
        .get('/api/v1/notifications');

      expect(res.status).to.equal(401);
      expect(res.body.success).to.equal(false);
    });

    it('should return user\'s notifications', async () => {
      const notif = await Notification.create({
        userId: customer.id,
        title: 'Test Bildirimi',
        body: 'Test içeriği',
        type: 'APPOINTMENT',
      });

      const res = await supertest(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data).to.have.property('data');
      expect(res.body.data.data).to.be.an('array');
      expect(res.body.data.meta).to.have.property('total');
      expect(res.body.data.meta).to.have.property('totalPages');

      await notif.destroy();
    });

    it('should return notifications ordered by createdAt DESC', async () => {
      const oldNotif = await Notification.create({
        userId: customer.id,
        title: 'Eski Bildirim',
        body: 'Eski içerik',
        type: 'SYSTEM',
      });

      await new Promise(r => setTimeout(r, 10)); // ensure ordering

      const newNotif = await Notification.create({
        userId: customer.id,
        title: 'Yeni Bildirim',
        body: 'Yeni içerik',
        type: 'REVIEW',
      });

      const res = await supertest(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.data.data.length).to.be.greaterThanOrEqual(2);

      // Latest notification should be first
      const firstNotif = res.body.data.data.find(n => n.id === newNotif.id);
      const lastNotif = res.body.data.data.find(n => n.id === oldNotif.id);
      expect(res.body.data.data.indexOf(firstNotif)).to.be.lessThan(
        res.body.data.data.indexOf(lastNotif)
      );

      await oldNotif.destroy();
      await newNotif.destroy();
    });

    it('should filter by isRead=true', async () => {
      const readNotif = await Notification.create({
        userId: customer.id,
        title: 'Okunan',
        body: 'Okundu',
        type: 'SYSTEM',
        isRead: true,
      });

      const unreadNotif = await Notification.create({
        userId: customer.id,
        title: 'Okunmamış',
        body: 'Okunmamış içerik',
        type: 'SYSTEM',
        isRead: false,
      });

      const res = await supertest(app)
        .get('/api/v1/notifications')
        .query({ isRead: 'true' })
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).to.equal(200);
      const ids = res.body.data.data.map(n => n.id);
      expect(ids).to.include(readNotif.id);
      expect(ids).to.not.include(unreadNotif.id);

      await readNotif.destroy();
      await unreadNotif.destroy();
    });

    it('should filter by isRead=false', async () => {
      const unreadNotif = await Notification.create({
        userId: customer.id,
        title: 'Sadece Okunmamış',
        body: 'Test',
        type: 'ORDER',
        isRead: false,
      });

      const res = await supertest(app)
        .get('/api/v1/notifications')
        .query({ isRead: 'false' })
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).to.equal(200);
      const ids = res.body.data.data.map(n => n.id);
      expect(ids).to.include(unreadNotif.id);

      await unreadNotif.destroy();
    });

    it('should filter by type', async () => {
      const apptNotif = await Notification.create({
        userId: customer.id,
        title: 'Randevu Bildirimi',
        body: 'Randevu detayı',
        type: 'APPOINTMENT',
      });

      const reviewNotif = await Notification.create({
        userId: customer.id,
        title: 'Değerlendirme Bildirimi',
        body: 'Yorum detayı',
        type: 'REVIEW',
      });

      const res = await supertest(app)
        .get('/api/v1/notifications')
        .query({ type: 'APPOINTMENT' })
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).to.equal(200);
      const ids = res.body.data.data.map(n => n.id);
      expect(ids).to.include(apptNotif.id);
      expect(ids).to.not.include(reviewNotif.id);

      await apptNotif.destroy();
      await reviewNotif.destroy();
    });

    it('should support pagination', async () => {
      // Create multiple notifications
      for (let i = 0; i < 5; i++) {
        await Notification.create({
          userId: customer.id,
          title: `Bildirim ${i}`,
          body: `İçerik ${i}`,
          type: 'SYSTEM',
        });
      }

      const res1 = await supertest(app)
        .get('/api/v1/notifications')
        .query({ page: 1, limit: 2 })
        .set('Authorization', `Bearer ${customerToken}`);

      const res2 = await supertest(app)
        .get('/api/v1/notifications')
        .query({ page: 2, limit: 2 })
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res1.status).to.equal(200);
      expect(res2.status).to.equal(200);
      expect(res1.body.data.data.length).to.be.lessThanOrEqual(2);
      expect(res2.body.data.data.length).to.be.lessThanOrEqual(2);

      // Meta information
      expect(res1.body.data.meta).to.have.property('page', 1);
      expect(res1.body.data.meta).to.have.property('limit', 2);
      expect(res1.body.data.meta).to.have.property('totalPages');
      expect(res1.body.data.meta).to.have.property('total');

      // Cleanup
      const all = await Notification.findAll({ where: { userId: customer.id, title: { [require('sequelize').Op.like]: '%Bildirim%' } } });
      for (const n of all) await n.destroy();
    });

    it('should only return the authenticated user\'s notifications', async () => {
      const ownerNotif = await Notification.create({
        userId: owner1.id,
        title: 'Owner Bildirimi',
        body: 'Owner içeriği',
        type: 'SYSTEM',
      });

      const res = await supertest(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).to.equal(200);
      const ids = res.body.data.data.map(n => n.id);
      expect(ids).to.not.include(ownerNotif.id);

      await ownerNotif.destroy();
    });
  });

  // ==================== GET /notifications/unread-count ====================

  describe('GET /notifications/unread-count', () => {
    it('should return 401 for unauthenticated request', async () => {
      const res = await supertest(app)
        .get('/api/v1/notifications/unread-count');

      expect(res.status).to.equal(401);
    });

    it('should return correct unread count', async () => {
      const unread1 = await Notification.create({
        userId: customer.id,
        title: 'Okunmamış 1',
        body: 'Test',
        type: 'SYSTEM',
        isRead: false,
      });

      const unread2 = await Notification.create({
        userId: customer.id,
        title: 'Okunmamış 2',
        body: 'Test',
        type: 'REVIEW',
        isRead: false,
      });

      const readNotif = await Notification.create({
        userId: customer.id,
        title: 'Okunan',
        body: 'Test',
        type: 'SYSTEM',
        isRead: true,
      });

      const res = await supertest(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data).to.have.property('count');
      expect(res.body.data.count).to.equal(2);

      await unread1.destroy();
      await unread2.destroy();
      await readNotif.destroy();
    });

    it('should return count 0 when no unread notifications', async () => {
      await Notification.create({
        userId: customer.id,
        title: 'Okunan',
        body: 'Test',
        type: 'SYSTEM',
        isRead: true,
      });

      const res = await supertest(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.data.count).to.equal(0);

      await Notification.destroy({ where: { userId: customer.id, title: 'Okunan' } });
    });
  });

  // ==================== PATCH /notifications/:id/read ====================

  describe('PATCH /notifications/:id/read', () => {
    it('should return 401 for unauthenticated request', async () => {
      const res = await supertest(app)
        .patch('/api/v1/notifications/some-id/read');

      expect(res.status).to.equal(401);
    });

    it('should mark notification as read', async () => {
      const notif = await Notification.create({
        userId: customer.id,
        title: 'İşaretlenecek Bildirim',
        body: 'Test',
        type: 'APPOINTMENT',
        isRead: false,
      });

      const res = await supertest(app)
        .patch(`/api/v1/notifications/${notif.id}/read`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data.isRead).to.equal(true);

      await notif.destroy();
    });

    it('should return 404 for non-existent notification', async () => {
      const res = await supertest(app)
        .patch('/api/v1/notifications/00000000-0000-0000-0000-000000000000/read')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).to.equal(404);
    });

    it('should return 404 when trying to mark another user\'s notification', async () => {
      const ownerNotif = await Notification.create({
        userId: owner1.id,
        title: 'Owner Bildirimi',
        body: 'Test',
        type: 'SYSTEM',
        isRead: false,
      });

      const res = await supertest(app)
        .patch(`/api/v1/notifications/${ownerNotif.id}/read`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).to.equal(404);

      await ownerNotif.destroy();
    });
  });

  // ==================== PATCH /notifications/read-all ====================

  describe('PATCH /notifications/read-all', () => {
    it('should return 401 for unauthenticated request', async () => {
      const res = await supertest(app)
        .patch('/api/v1/notifications/read-all');

      expect(res.status).to.equal(401);
    });

    it('should mark all unread notifications as read', async () => {
      const notif1 = await Notification.create({
        userId: customer.id,
        title: 'Top 1',
        body: 'Test',
        type: 'SYSTEM',
        isRead: false,
      });

      const notif2 = await Notification.create({
        userId: customer.id,
        title: 'Top 2',
        body: 'Test',
        type: 'REVIEW',
        isRead: false,
      });

      const alreadyRead = await Notification.create({
        userId: customer.id,
        title: 'Zaten Okunan',
        body: 'Test',
        type: 'SYSTEM',
        isRead: true,
      });

      const res = await supertest(app)
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data.message).to.include('okundu');

      // Verify all are now read
      const unreadCount = await Notification.count({
        where: { userId: customer.id, isRead: false },
      });
      expect(unreadCount).to.equal(0);

      await notif1.destroy();
      await notif2.destroy();
      await alreadyRead.destroy();
    });

    it('should only affect the authenticated user\'s notifications', async () => {
      const ownerUnread = await Notification.create({
        userId: owner1.id,
        title: 'Owner Okunmamış',
        body: 'Test',
        type: 'SYSTEM',
        isRead: false,
      });

      const res = await supertest(app)
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).to.equal(200);

      // Owner's notification should still be unread
      const ownerNotif = await Notification.findByPk(ownerUnread.id);
      expect(ownerNotif.isRead).to.equal(false);

      await ownerUnread.destroy();
    });
  });

  // ==================== DELETE /notifications/:id ====================

  describe('DELETE /notifications/:id', () => {
    it('should return 401 for unauthenticated request', async () => {
      const res = await supertest(app)
        .delete('/api/v1/notifications/some-id');

      expect(res.status).to.equal(401);
    });

    it('should delete the notification', async () => {
      const notif = await Notification.create({
        userId: customer.id,
        title: 'Silinecek Bildirim',
        body: 'Test',
        type: 'SYSTEM',
      });

      const res = await supertest(app)
        .delete(`/api/v1/notifications/${notif.id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data.message).to.include('silindi');

      // Verify deletion
      const deleted = await Notification.findByPk(notif.id);
      expect(deleted).to.be.null;
    });

    it('should return 404 for non-existent notification', async () => {
      const res = await supertest(app)
        .delete('/api/v1/notifications/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).to.equal(404);
    });

    it('should return 404 when trying to delete another user\'s notification', async () => {
      const ownerNotif = await Notification.create({
        userId: owner1.id,
        title: 'Owner Bildirimi',
        body: 'Test',
        type: 'SYSTEM',
      });

      const res = await supertest(app)
        .delete(`/api/v1/notifications/${ownerNotif.id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).to.equal(404);

      // Verify owner's notification still exists
      const stillExists = await Notification.findByPk(ownerNotif.id);
      expect(stillExists).to.not.be.null;

      await ownerNotif.destroy();
    });
  });
});
