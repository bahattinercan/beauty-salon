const fs = require('fs');
const path = require('path');
const supertest = require('supertest');
const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { syncDB, seedTestData } = require('./setup');
const { UPLOAD_DEST } = require('../src/middlewares/upload');

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-unit-tests-only-32chars!';

// 1x1 geçerli PNG
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

// MAX_FILE_SIZE (5MB) üstü, geçerim tipinde
const OVERSIZED = Buffer.alloc(6 * 1024 * 1024, 0x89);

const BOUNDARY = '----beautySalonTestBoundary1234567890';

function multipart(fields, boundary = BOUNDARY) {
  const parts = [];
  for (const f of fields) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${f.name}"; filename="${f.filename}"\r\nContent-Type: ${f.type}\r\n\r\n`
      )
    );
    parts.push(f.data);
    parts.push(Buffer.from('\r\n'));
  }
  parts.push(Buffer.from(`--${boundary}--\r\n`));
  return { body: Buffer.concat(parts), contentType: `multipart/form-data; boundary=${boundary}` };
}

describe('Upload API', () => {
  let token;
  let salonId;
  const createdFiles = [];

  const upload = (route, fields) => {
    const m = multipart(fields);
    return supertest(app)
      .post(route)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', m.contentType)
      .send(m.body);
  };

  // Yükleme sonrası diskte oluşan dosyaları test bitince temizle
  const track = (url) => {
    if (typeof url === 'string' && url.startsWith('/uploads/')) {
      createdFiles.push(path.join(UPLOAD_DEST, url.split('/').pop()));
    }
  };

  before(async () => {
    await syncDB();
    const data = await seedTestData();
    token = jwt.sign(
      { sub: data.users.owner1.id, email: data.users.owner1.email, role: data.users.owner1.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    salonId = data.salons.salon1.id;
  });

  after(() => {
    for (const file of createdFiles) {
      try {
        fs.unlinkSync(file);
      } catch {
        // dosya zaten yoksa sorun değil
      }
    }
  });

  describe('POST /upload/single', () => {
    it('should upload a valid image and return its url', async () => {
      const res = await upload('/api/v1/upload/single', [
        { name: 'file', filename: 'logo.png', type: 'image/png', data: PNG },
      ]);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data.url).to.match(/^\/uploads\/[a-f0-9-]+\.png$/);
      expect(res.body.data.originalName).to.equal('logo.png');
      expect(res.body.data.size).to.equal(PNG.length);

      const onDisk = path.join(UPLOAD_DEST, path.basename(res.body.data.url));
      expect(fs.existsSync(onDisk)).to.equal(true);
      track(res.body.data.url);
    });

    it('should serve the uploaded file over /uploads static route', async () => {
      const res = await upload('/api/v1/upload/single', [
        { name: 'file', filename: 'cover.jpg', type: 'image/jpeg', data: PNG },
      ]);
      expect(res.status).to.equal(200);

      const served = await supertest(app).get(res.body.data.url);
      expect(served.status).to.equal(200);
      expect(served.body.length).to.equal(PNG.length);
      track(res.body.data.url);
    });

    it('should return 400 when no file is attached', async () => {
      const m = multipart([]);
      const res = await supertest(app)
        .post('/api/v1/upload/single')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', m.contentType)
        .send(m.body);

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body.message).to.include('Dosya yüklenmedi');
    });

    it('should reject a non-image mimetype with 400', async () => {
      const res = await upload('/api/v1/upload/single', [
        { name: 'file', filename: 'not_an_image.txt', type: 'text/plain', data: Buffer.from('hello') },
      ]);

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body.message).to.include('JPEG');
    });

    it('should reject a file larger than MAX_FILE_SIZE with 400', async () => {
      const res = await upload('/api/v1/upload/single', [
        { name: 'file', filename: 'huge.png', type: 'image/png', data: OVERSIZED },
      ]);

      expect(res.status).to.equal(400);
      expect(res.body.message).to.include('boyutu çok büyük');
    });

    it('should reject an unexpected field name with 400', async () => {
      const res = await upload('/api/v1/upload/single', [
        { name: 'files', filename: 'wrong.png', type: 'image/png', data: PNG },
      ]);

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('success', false);
    });

    it('should require authentication', async () => {
      const m = multipart([{ name: 'file', filename: 'x.png', type: 'image/png', data: PNG }]);
      const res = await supertest(app)
        .post('/api/v1/upload/single')
        .set('Content-Type', m.contentType)
        .send(m.body);

      expect(res.status).to.equal(401);
    });
  });

  describe('POST /upload/multiple', () => {
    it('should upload several images and return every url', async () => {
      const res = await upload('/api/v1/upload/multiple', [
        { name: 'files', filename: 'gallery1.png', type: 'image/png', data: PNG },
        { name: 'files', filename: 'gallery2.png', type: 'image/png', data: PNG },
        { name: 'files', filename: 'gallery3.webp', type: 'image/webp', data: PNG },
      ]);

      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array').with.lengthOf(3);
      for (const item of res.body.data) {
        expect(item.url).to.match(/^\/uploads\/[a-f0-9-]+\./);
        expect(fs.existsSync(path.join(UPLOAD_DEST, path.basename(item.url)))).to.equal(true);
        track(item.url);
      }

      // Her dosya benzersiz isimle diskte olmalı
      const urls = res.body.data.map((d) => d.url);
      expect(new Set(urls).size).to.equal(3);
    });

    it('should return 400 when no files are attached', async () => {
      const m = multipart([]);
      const res = await supertest(app)
        .post('/api/v1/upload/multiple')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', m.contentType)
        .send(m.body);

      expect(res.status).to.equal(400);
      expect(res.body.message).to.include('Dosya yüklenmedi');
    });

    it('should reject more than 10 files with 400', async () => {
      const fields = Array.from({ length: 11 }, (_, i) => ({
        name: 'files',
        filename: `img${i}.png`,
        type: 'image/png',
        data: PNG,
      }));

      const res = await upload('/api/v1/upload/multiple', fields);

      expect(res.status).to.equal(400);
      expect(res.body.message).to.include('10');
    });

    it('should reject the whole batch when one file is not an image', async () => {
      const res = await upload('/api/v1/upload/multiple', [
        { name: 'files', filename: 'ok.png', type: 'image/png', data: PNG },
        { name: 'files', filename: 'bad.pdf', type: 'application/pdf', data: Buffer.from('%PDF-1.5') },
      ]);

      expect(res.status).to.equal(400);
      expect(res.body.message).to.include('JPEG');
    });
  });

  describe('POST /upload/video', () => {
    // Minimal MP4 başlığı (ftyp box) — multer sadece mimetype'a bakar
    const MP4 = Buffer.concat([
      Buffer.from([0x00, 0x00, 0x00, 0x18]),
      Buffer.from('ftypisom', 'ascii'),
      Buffer.from([0x00, 0x00, 0x02, 0x00]),
      Buffer.from('isomiso2avc1mp41', 'ascii'),
    ]);

    it('should upload a valid mp4 video and serve it under /uploads', async () => {
      const res = await upload('/api/v1/upload/video', [
        { name: 'file', filename: 'tanitim.mp4', type: 'video/mp4', data: MP4 },
      ]);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data.url).to.match(/^\/uploads\/[a-f0-9-]+\.mp4$/);
      expect(res.body.data.originalName).to.equal('tanitim.mp4');
      expect(res.body.data.size).to.equal(MP4.length);

      const onDisk = path.join(UPLOAD_DEST, path.basename(res.body.data.url));
      expect(fs.existsSync(onDisk)).to.equal(true);
      track(res.body.data.url);

      const served = await supertest(app).get(res.body.data.url);
      expect(served.status).to.equal(200);
      expect(served.body.length).to.equal(MP4.length);
    });

    it('should reject an image mimetype with 400', async () => {
      const res = await upload('/api/v1/upload/video', [
        { name: 'file', filename: 'logo.png', type: 'image/png', data: PNG },
      ]);

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body.message).to.include('MP4');
    });

    it('should return 400 when no file is attached', async () => {
      const m = multipart([]);
      const res = await supertest(app)
        .post('/api/v1/upload/video')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', m.contentType)
        .send(m.body);

      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body.message).to.include('Dosya yüklenmedi');
    });

    it('should require authentication', async () => {
      const m = multipart([{ name: 'file', filename: 'x.mp4', type: 'video/mp4', data: MP4 }]);
      const res = await supertest(app)
        .post('/api/v1/upload/video')
        .set('Content-Type', m.contentType)
        .send(m.body);

      expect(res.status).to.equal(401);
    });
  });

  describe('Ucdan uca: galeri alanına kaydetme', () => {
    it('should store uploaded gallery urls on the salon record', async () => {
      const uploadRes = await upload('/api/v1/upload/multiple', [
        { name: 'files', filename: 'g1.png', type: 'image/png', data: PNG },
        { name: 'files', filename: 'g2.png', type: 'image/png', data: PNG },
      ]);
      expect(uploadRes.status).to.equal(200);
      const urls = uploadRes.body.data.map((d) => d.url);
      urls.forEach(track);

      const patchRes = await supertest(app)
        .patch(`/api/v1/salons/${salonId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ galleryImages: urls, logoUrl: urls[0] });

      expect(patchRes.status).to.equal(200);
      expect(patchRes.body.data.galleryImages).to.deep.equal(urls);
      expect(patchRes.body.data.logoUrl).to.equal(urls[0]);

      // JSON olarak saklanan galeri tekrar dizi olarak okunmalı
      const getRes = await supertest(app)
        .get(`/api/v1/salons/${salonId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(getRes.body.data.galleryImages).to.deep.equal(urls);
    });
  });
});
