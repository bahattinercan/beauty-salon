const supertest = require('supertest');
const { expect } = require('chai');
const app = require('../src/app');
const { syncDB } = require('./setup');

const request = supertest(app);

describe('App-level routing & error handling', () => {
  before(async () => {
    await syncDB();
  });

  describe('health & root', () => {
    it('GET /api/v1 health check returns success', async () => {
      const res = await request.get('/api/v1/health');
      expect(res.status).to.equal(200);
      expect(res.body.success).to.equal(true);
      expect(res.body.message).to.equal('Beauty Salon API is running');
      expect(res.body.timestamp).to.be.a('string');
    });

    it('GET /api/v1 lists the available endpoints', async () => {
      const res = await request.get('/api/v1');
      expect(res.status).to.equal(200);
      expect(res.body.endpoints).to.be.an('array').that.includes('/api/v1/salons');
    });
  });

  describe('unknown route 404 fallback', () => {
    it('GET bilinmeyen bir API route JSON 404 döner', async () => {
      const res = await request.get('/api/v1/definitely-not-a-route');
      expect(res.status).to.equal(404);
      expect(res.headers['content-type']).to.include('application/json');
      expect(res.body.success).to.equal(false);
      expect(res.body.message).to.include('Route bulunamadı');
    });

    it('POST bilinmeyen bir API route da JSON 404 döner', async () => {
      const res = await request.post('/api/v1/whatever').send({ foo: 'bar' });
      expect(res.status).to.equal(404);
      expect(res.body.success).to.equal(false);
    });

    it('mevcut bir route un, olmayan bir resource id -> 404 JSON', async () => {
      const res = await request.get('/api/v1/salons/00000000-0000-0000-0000-000000000000');
      expect(res.status).to.equal(404);
      expect(res.body.success).to.equal(false);
    });
  });

  describe('error handler', () => {
    it('express-validator hatası 400 + errors dizisi döner', async () => {
      const res = await request.post('/api/v1/auth/register').send({ email: 'not-an-email' });
      expect(res.status).to.equal(400);
      expect(res.body.success).to.equal(false);
      expect(res.body.errors).to.be.an('array').with.length.greaterThan(0);
    });

    it('kötü UUID formatu 500 değil, 404 "Salon bulunamadı" döner', async () => {
      const res = await request.get('/api/v1/salons/not-a-uuid');
      expect(res.status).to.equal(404);
      expect(res.body.success).to.equal(false);
      expect(res.body.message).to.equal('Salon bulunamadı');
    });
  });

  describe('CORS', () => {
    it('izinli origin için Access-Control-Allow-Origin döner', async () => {
      const res = await request.get('/api/v1/health').set('Origin', 'http://localhost:3000');
      expect(res.headers['access-control-allow-origin']).to.equal('http://localhost:3000');
    });

    it('development ortamında localhost portları kabul edilir (admin panel 3400)', async () => {
      const res = await request.get('/api/v1/health').set('Origin', 'http://127.0.0.1:3400');
      expect(res.headers['access-control-allow-origin']).to.equal('http://127.0.0.1:3400');
    });

    it('PUT preflight izinli — settings kaydı tarayıcıdan çalışabilir', async () => {
      const res = await request
        .options('/api/v1/settings')
        .set('Origin', 'http://localhost:3400')
        .set('Access-Control-Request-Method', 'PUT');
      expect(res.headers['access-control-allow-methods']).to.include('PUT');
    });

    it('izinli olmayan origin reddedilir', async () => {
      const res = await request.get('/api/v1/health').set('Origin', 'http://evil.example.com');
      expect(res.headers['access-control-allow-origin']).to.be.undefined;
    });
  });
});
