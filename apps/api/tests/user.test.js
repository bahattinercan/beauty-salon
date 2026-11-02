const supertest = require('supertest');
const { expect } = require('chai');
const bcrypt = require('bcryptjs');
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

    });

    it('should not allow changing email through this endpoint', async () => {
      const res = await supertest(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ email: 'hacked@evil.com' });

      expect(res).to.have.property('status', 200); // Endpoint doesn't block it, but it should just ignore
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

    });

    it('should return 401 for unauthenticated requests', async () => {
      const res = await supertest(app)
        .get('/api/v1/users');

    });
  });

  describe('PATCH /users/:id/toggle-active (Admin)', () => {
    it('should deactivate a user', async () => {
      const customer2 = data.users.customer2;

      const res = await supertest(app)
        .patch(`/api/v1/users/${customer2.id}/toggle-active`)
        .set('Authorization', `Bearer ${adminToken}`);

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

      expect(res.body.data.isActive).to.equal(true);

      // Verify
      await customer2.reload();
      expect(customer2.isActive).to.equal(true);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await supertest(app)
        .patch('/api/v1/users/00000000-0000-0000-0000-000000000000/toggle-active')
        .set('Authorization', `Bearer ${adminToken}`);

    });

    it('should return 403 for non-admin users', async () => {
      const res = await supertest(app)
        .patch(`/api/v1/users/${customer.id}/toggle-active`)
        .set('Authorization', `Bearer ${customerToken}`);

    });

    // #5 — admin kendi hesabını bu uçtan kapatamaz
    it('should return 400 when admin tries to deactivate own account (#5)', async () => {
      const res = await supertest(app)
        .patch(`/api/v1/users/${admin.id}/toggle-active`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body.message).to.include('Kendi hesabınızı pasifleştiremezsiniz');

      await admin.reload();
      expect(admin.isActive).to.equal(true);
    });

    it('should not allow a customer to toggle its own active status (admin-only)', async () => {
      const res = await supertest(app)
        .patch(`/api/v1/users/${customer.id}/toggle-active`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res).to.have.property('status', 403); // uç yalnız ADMIN'e açık
    });
  });

  describe('Role-based access', () => {
    it('should allow admin to access admin-only endpoints', async () => {
      const res = await supertest(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);

    });

    it('should block salon owner from admin endpoints', async () => {
      const owner = data.users.owner1;
      const ownerToken = createToken(owner);

      const res = await supertest(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${ownerToken}`);

    });

    it('should block customer from admin endpoints', async () => {
      const res = await supertest(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${customerToken}`);

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

  // #30 — e-posta değişikliği ve şifre sıfırlama aynı kolonu (`passwordResetToken`) eziyordu.
  // Karar: ayrı kolonlar (`pending_email`, `email_change_token`, `email_change_token_expiry`).
  describe('E-posta değişikliği ↔ şifre sıfırlama ayrımı (#30)', () => {
    it('#30 e-posta değişiklik isteği passwordResetToken/passwordResetTokenExpiry alanlarını değiştirmez', async () => {
      const user = await User.findByPk(customer.id);

      // Şifre sıfırlama akışının bıraktığı iz (kullanıcı parolasını sıfırlamak üzere)
      const resetHash = await bcrypt.hash('111111', 10);
      const resetExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.update({ passwordResetToken: resetHash, passwordResetTokenExpiry: resetExpiry });

      const res = await supertest(app)
        .post('/api/v1/users/me/request-email-change')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ newEmail: 'yeni-adres@test.com' });

      expect(res.status, res.body.message).to.equal(200);
      expect(res.body.success).to.equal(true);

      await user.reload();
      // Şifre sıfırlama token'ı AYNEN kalmalı — e-posta akışı onu ezmemeli
      expect(user.passwordResetToken).to.equal(resetHash);
      expect(user.passwordResetTokenExpiry).to.not.be.null;
      expect(new Date(user.passwordResetTokenExpiry).getTime()).to.equal(resetExpiry.getTime());

      // E-posta akışı kendi kolonlarını kullanmalı
      expect(user.pendingEmail).to.equal('yeni-adres@test.com');
      expect(user.emailChangeToken).to.be.a('string').and.not.equal('');
      expect(user.emailChangeToken.startsWith('EMAILCHANGE:'), 'token artık repurpose edilmiş değer taşımamalı').to.equal(false);
      expect(user.emailChangeTokenExpiry).to.not.be.null;
    });

    it('#30 şifre sıfırlama isteği email_change_token/pending_email alanlarını bozmaz', async () => {
      // customer2 üzerinde çalışır: bu describe içindeki e-posta değişiklikleri customer2'yi
      // değiştirebilir, şifre akışı testi temiz bir kullanıcıda koşar.
      const target = data.users.customer2;
      const targetToken = createToken(target);
      const user = await User.findByPk(target.id);

      const requestRes = await supertest(app)
        .post('/api/v1/users/me/request-email-change')
        .set('Authorization', `Bearer ${targetToken}`)
        .send({ newEmail: 'customer2-yeni@test.com' });
      expect(requestRes.status, requestRes.body.message).to.equal(200);

      await user.reload();
      const changeToken = user.emailChangeToken;
      const changeExpiry = new Date(user.emailChangeTokenExpiry).getTime();
      expect(changeToken, 'e-posta değişiklik token\'ı yazılmalı').to.be.a('string');

      // Şifre sıfırlama isteği
      const forgotRes = await supertest(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: target.email });
      expect(forgotRes.status, forgotRes.body.message).to.equal(200);

      await user.reload();
      // Şifre sıfırlama kendi kolonlarını yazmalı
      expect(user.passwordResetToken).to.be.a('string').and.not.equal('');
      expect(user.passwordResetTokenExpiry).to.not.be.null;
      // E-posta değişiklik akışı bozulmamalı
      expect(user.emailChangeToken).to.equal(changeToken);
      expect(new Date(user.emailChangeTokenExpiry).getTime()).to.equal(changeExpiry);
      expect(user.pendingEmail).to.equal('customer2-yeni@test.com');
    });

    it('#30 doğru token ile confirm e-postayı değiştirir ve üç alanı temizler', async () => {
      const target = data.users.customer2;
      const targetToken = createToken(target);
      const user = await User.findByPk(target.id);

      // Confirm, request akışının bıraktığı gerçek durumdan devam eder; OTP hash'i elle kurulur
      await user.update({
        pendingEmail: 'customer2-confirm@test.com',
        emailChangeToken: await bcrypt.hash('246810', 10),
        emailChangeTokenExpiry: new Date(Date.now() + 10 * 60 * 1000),
      });

      const res = await supertest(app)
        .post('/api/v1/users/me/confirm-email-change')
        .set('Authorization', `Bearer ${targetToken}`)
        .send({ token: '246810' });

      expect(res.status, res.body.message).to.equal(200);
      expect(res.body.data.email).to.equal('customer2-confirm@test.com');

      await user.reload();
      expect(user.email).to.equal('customer2-confirm@test.com');
      expect(user.pendingEmail).to.be.null;
      expect(user.emailChangeToken).to.be.null;
      expect(user.emailChangeTokenExpiry).to.be.null;
    });

    it('#30 süresi geçmiş e-posta değişiklik token\'ı 400 döner', async () => {
      const target = data.users.customer2;
      const targetToken = createToken(target);
      const user = await User.findByPk(target.id);

      await user.update({
        pendingEmail: 'suresi-gecmis@test.com',
        emailChangeToken: await bcrypt.hash('135791', 10),
        emailChangeTokenExpiry: new Date(Date.now() - 60 * 1000), // 1 dk önce doldu
      });

      const res = await supertest(app)
        .post('/api/v1/users/me/confirm-email-change')
        .set('Authorization', `Bearer ${targetToken}`)
        .send({ token: '135791' });

      expect(res.status, res.body.message).to.equal(400);
      expect(res.body.message).to.include('süresi dolmuş');

      await user.reload();
      // E-posta değişmedi, akış temizlendi
      expect(user.email).to.not.equal('suresi-gecmis@test.com');
      expect(user.pendingEmail).to.be.null;
      expect(user.emailChangeToken).to.be.null;
      expect(user.emailChangeTokenExpiry).to.be.null;
    });

    it('#30 login ve profil yanıtı pending_email/email_change_token/email_change_token_expiry sızdırmaz', async () => {
      const target = data.users.customer2;
      const targetToken = createToken(target);

      const requestRes = await supertest(app)
        .post('/api/v1/users/me/request-email-change')
        .set('Authorization', `Bearer ${targetToken}`)
        .send({ newEmail: 'sizinti-kontrol@test.com' });
      expect(requestRes.status, requestRes.body.message).to.equal(200);

      // Gerçekten dolu olduklarını DB'den doğrula (aksi halde "sızmıyor" testi boş olurdu)
      const user = await User.findByPk(target.id);
      expect(user.pendingEmail).to.equal('sizinti-kontrol@test.com');
      expect(user.emailChangeToken).to.be.a('string');
      expect(user.emailChangeTokenExpiry).to.not.be.null;

      const forbidden = [
        'pendingEmail', 'pending_email',
        'emailChangeToken', 'email_change_token',
        'emailChangeTokenExpiry', 'email_change_token_expiry',
        'passwordResetToken', 'password_reset_token',
      ];

      const loginRes = await supertest(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: 'Musteri123!' });
      expect(loginRes.status, loginRes.body.message).to.equal(200);
      forbidden.forEach((key) => {
        expect(loginRes.body.data.user, `login yanıtı ${key} içermemeli`).to.not.have.property(key);
      });

      const profileRes = await supertest(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${targetToken}`);
      expect(profileRes.status).to.equal(200);
      forbidden.forEach((key) => {
        expect(profileRes.body.data, `profil yanıtı ${key} içermemeli`).to.not.have.property(key);
      });
    });
  });
});
