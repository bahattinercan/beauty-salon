const supertest = require('supertest');
const { expect } = require('chai');
const app = require('../src/app');
const { syncDB, seedTestData, teardownDB } = require('./setup');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-unit-tests-only-32chars!';

const createToken = (user) => {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
};

const createRefreshToken = (user) => {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-key-for-unit-tests-32chars!',
    { expiresIn: '7d' }
  );
};

describe('Auth API', () => {
  let data;
  let User;

  before(async () => {
    await syncDB();
    data = await seedTestData();
    User = require('../src/models').User;
  });

  after(async () => {
    await teardownDB();
  });

  describe('POST /auth/register', () => {
    it('should register a new customer successfully', async () => {
      const res = await supertest(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser@test.com',
          password: 'Password123!',
          fullName: 'Test User',
          phone: '+905551234567',
          role: 'CUSTOMER',
        });

      expect(res.status).to.equal(201);
      expect(res.body.success).to.equal(true);
      expect(res.body.data.user).to.have.property('email', 'newuser@test.com');
      expect(res.body.data.user).to.have.property('role', 'CUSTOMER');
      expect(res.body.data.user).to.not.have.property('passwordHash');
      expect(res.body.data).to.have.property('accessToken');
      expect(res.body.data).to.have.property('refreshToken');
    });

    it('should register with default CUSTOMER role when role is omitted', async () => {
      const res = await supertest(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'norole@test.com',
          password: 'Password123!',
          fullName: 'No Role User',
        });

      expect(res.status).to.equal(201);
      expect(res.body.data.user.role).to.equal('CUSTOMER');
    });

    it('should return 409 when email already exists', async () => {
      const res = await supertest(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'customer@test.com',
          password: 'Password123!',
          fullName: 'Duplicate User',
        });

      expect(res.status).to.equal(409);
      expect(res.body.success).to.equal(false);
    });

    it('should return 409 when phone already exists', async () => {
      const res = await supertest(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'dup-phone@test.com',
          password: 'Password123!',
          fullName: 'Dup Phone',
          phone: '+905339876543',
        });

      expect(res.status).to.equal(409);
      expect(res.body.success).to.equal(false);
    });

    it('should return 400 for invalid email format', async () => {
      const res = await supertest(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'not-an-email',
          password: 'Password123!',
          fullName: 'Bad Email',
        });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.equal(false);
    });

    it('should return 400 when password is too short', async () => {
      const res = await supertest(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'shortpwd@test.com',
          password: 'abc',
          fullName: 'Short Password',
        });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.equal(false);
    });

    it('should return 400 when fullName is too short', async () => {
      const res = await supertest(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'shortname@test.com',
          password: 'Password123!',
          fullName: 'A',
        });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.equal(false);
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const res = await supertest(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'customer@test.com',
          password: 'Musteri123!',
        });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data.user.email).to.equal('customer@test.com');
      expect(res.body.data).to.have.property('accessToken');
      expect(res.body.data).to.have.property('refreshToken');
    });

    it('should return 401 for wrong password', async () => {
      const res = await supertest(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'customer@test.com',
          password: 'WrongPassword123!',
        });

      expect(res.status).to.equal(401);
      expect(res.body.success).to.equal(false);
    });

    it('should return 401 for non-existent email', async () => {
      const res = await supertest(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nobody@test.com',
          password: 'Password123!',
        });

      expect(res.status).to.equal(401);
      expect(res.body.success).to.equal(false);
    });

    it('should return 401 for inactive user', async () => {
      const user = await User.findOne({ where: { email: 'customer2@test.com' } });
      await user.update({ isActive: false });

      const res = await supertest(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'customer@test.com',
          password: 'Musteri123!',
        });

      expect(res.status).to.equal(401);
      expect(res.body.message).to.include('devre dışı');

      await user.update({ isActive: true });
    });

    it('should return 400 when email or password is missing', async () => {
      const res = await supertest(app)
        .post('/api/v1/auth/login')
        .send({ email: 'customer@test.com' });

      expect(res.status).to.equal(400);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const user = await User.findOne({ where: { email: 'customer2@test.com' } });
      const refreshToken = createRefreshToken(user);
      const hashedRefresh = await bcrypt.hash(refreshToken, 12);
      await user.update({ refreshToken: hashedRefresh });

      const res = await supertest(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.data).to.have.property('accessToken');
      expect(res.body.data).to.have.property('refreshToken');
    });

    it('should return 401 for invalid refresh token', async () => {
      const res = await supertest(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token-here' });

      expect(res.status).to.equal(401);
    });

    it('should return 400 when refresh token is missing', async () => {
      const res = await supertest(app)
        .post('/api/v1/auth/refresh')
        .send({});

      expect(res.status).to.equal(400);
    });

    it('should return 401 when refresh token does not match stored hash', async () => {
      const user = await User.findOne({ where: { email: 'customer2@test.com' } });
      const refreshToken = createRefreshToken(user);
      const wrongHash = await bcrypt.hash('completely-different-token', 12);
      await user.update({ refreshToken: wrongHash });

      const res = await supertest(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(res.status).to.equal(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout and clear refresh token', async () => {
      const user = await User.findOne({ where: { email: 'customer2@test.com' } });
      const token = createToken(user);

      const res = await supertest(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).to.equal(200);
      expect(res.body.data.message).to.include('çıkış');

      await user.reload();
      expect(user.refreshToken).to.be.null;
    });
  });

  describe('POST /auth/change-password', () => {
    it('should change password successfully', async () => {
      const user = await User.findOne({ where: { email: 'customer2@test.com' } });
      const token = createToken(user);

      const res = await supertest(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'Musteri123!',
          newPassword: 'NewPassword456!',
        });

      expect(res.status).to.equal(200);
      expect(res.body.data.message).to.include('Şifre');

      // Verify new password works
      const loginRes = await supertest(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'customer2@test.com',
          password: 'NewPassword456!',
        });

      expect(loginRes.status).to.equal(200);

      // Revert
      await user.update({ passwordHash: 'Musteri123!' });
    });

    it('should return 400 for wrong current password', async () => {
      const user = await User.findOne({ where: { email: 'customer2@test.com' } });
      const token = createToken(user);

      const res = await supertest(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword456!',
        });

      expect(res.status).to.equal(400);
    });

    it('should return 400 when new password is too short', async () => {
      const user = await User.findOne({ where: { email: 'customer2@test.com' } });
      const token = createToken(user);

      const res = await supertest(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'Musteri123!',
          newPassword: 'abc',
        });

      expect(res.status).to.equal(400);
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should return success for a registered email', async () => {
      const res = await supertest(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'customer@test.com' });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
    });

    it('should return same success message for non-existent email (security)', async () => {
      const res = await supertest(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@test.com' });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
    });

    it('should return 400 when email is missing', async () => {
      const res = await supertest(app)
        .post('/api/v1/auth/forgot-password')
        .send({});

      expect(res.status).to.equal(400);
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      const user = await User.findOne({ where: { email: 'customer2@test.com' } });

      const expiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.update({
        passwordResetToken: '123456',
        passwordResetTokenExpiry: expiry,
      });

      const res = await supertest(app)
        .post('/api/v1/auth/reset-password')
        .send({
          email: 'customer2@test.com',
          token: '123456',
          newPassword: 'ResetPassword789!',
        });

      expect(res.status).to.equal(200);
      expect(res.body.data.message).to.include('sıfırlandı');

      const loginRes = await supertest(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'customer2@test.com',
          password: 'ResetPassword789!',
        });

      expect(loginRes.status).to.equal(200);

      await user.reload();
      expect(user.passwordResetToken).to.be.null;
      expect(user.passwordResetTokenExpiry).to.be.null;
    });

    it('should return 400 for expired token', async () => {
      const user = await User.findOne({ where: { email: 'customer2@test.com' } });

      const expiry = new Date(Date.now() - 60 * 1000);
      await user.update({
        passwordResetToken: '654321',
        passwordResetTokenExpiry: expiry,
      });

      const res = await supertest(app)
        .post('/api/v1/auth/reset-password')
        .send({
          email: 'customer@test.com',
          token: '654321',
          newPassword: 'NewPass123!',
        });

      expect(res.status).to.equal(400);
    });

    it('should return 400 for wrong token', async () => {
      const user = await User.findOne({ where: { email: 'customer2@test.com' } });

      await user.update({
        passwordResetToken: 'correct-token',
        passwordResetTokenExpiry: new Date(Date.now() + 600000),
      });

      const res = await supertest(app)
        .post('/api/v1/auth/reset-password')
        .send({
          email: 'customer@test.com',
          token: 'wrong-token',
          newPassword: 'NewPass123!',
        });

      expect(res.status).to.equal(400);
    });
  });
});
