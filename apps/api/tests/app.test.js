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

    // #31 — liste, mount edilen tüm router prefixlerini kapsamalı
    it('GET /api/v1 endpoint listesi mount edilen tüm router prefixlerini içerir (#31)', async () => {
      const { ROUTES } = require('../src/routes/route-table');
      const prefix = process.env.API_PREFIX || '/api/v1';

      const res = await request.get('/api/v1');
      expect(res.status).to.equal(200);

      const listed = res.body.endpoints;
      expect(listed).to.be.an('array');
      ROUTES.forEach((route) => {
        expect(listed, `${route.prefix} listede yok`).to.include(`${prefix}${route.prefix}`);
      });
      expect(listed).to.include(`${prefix}/health`);
      expect(new Set(listed).size, 'listede yinelenen kayıt var').to.equal(listed.length);
    });

    // #31 — route tablosu tek kaynak: her kayıt gerçekten mount edilebilir bir router olmalı
    it('route tablosundaki her kayıt gerçek bir express router (#31)', () => {
      const { ROUTES } = require('../src/routes/route-table');

      expect(ROUTES.length).to.be.greaterThan(0);
      ROUTES.forEach((route) => {
        expect(route.prefix, 'prefix / ile başlamalı').to.match(/^\/[a-z-]+$/);
        expect(typeof route.router, `${route.prefix} router değil`).to.equal('function');
      });
      const prefixes = ROUTES.map((route) => route.prefix);
      expect(new Set(prefixes).size, 'aynı prefix iki kez mount edilmiş').to.equal(prefixes.length);
    });
  });

  describe('ölü kod temizliği (#23, #24)', () => {
    const fs = require('fs');
    const path = require('path');
    const readSrc = (rel) => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

    it('errorHandler içinde ölü express-validator dalı kalmadı (#24)', () => {
      const src = readSrc('src/middlewares/errorHandler.js');
      expect(src).to.not.include("err.type === 'validation'");
    });

    it('product.validator yalnız kullanılan validator\'ı dışa aktarır (#23)', () => {
      const exported = Object.keys(require('../src/validators/product.validator'));
      expect(exported).to.deep.equal(['updateProductValidator']);
    });

    it('auth middleware yalnız kullanılan middleware\'leri dışa aktarır (#23)', () => {
      const exported = Object.keys(require('../src/middlewares/auth')).sort();
      expect(exported).to.deep.equal(['authenticate', 'authorize']);
    });

    // #24 — express-validator hataları `validate` middleware'inde yanıtlanır:
    // yanıttaki errors düz string dizisidir (errorHandler'ın err.errors dalı değil).
    it('express-validator hataları validate middleware tarafından yanıtlanır (#24)', async () => {
      const res = await request.post('/api/v1/auth/register').send({ email: 'bozuk' });

      expect(res.status).to.equal(400);
      expect(res.body.success).to.equal(false);
      expect(res.body.errors).to.be.an('array').with.length.greaterThan(0);
      res.body.errors.forEach((msg) => expect(msg).to.be.a('string'));
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
