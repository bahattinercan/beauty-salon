// AP-001 — kart modunda alan kaybı düzeltmesinin görsel kanıtı (390px) + tablo karesi (1440px).
// Çalıştırma: CDP_PORT=9444 node screenshots/_harness/drive.js screenshots/_harness/plan-admin-cardmode-check.js
const fs = require('fs');
const AT = fs.readFileSync(process.env.TEMP + '/admin_at.txt', 'utf8').trim();
const BASE = process.env.ADMIN_BASE || 'http://127.0.0.1:3002';

const seed = `(() => {
  localStorage.setItem('access_token', ${JSON.stringify(AT)});
  localStorage.setItem('user', JSON.stringify({fullName:'Platform Admin',email:'admin@beautysalon.com',role:'ADMIN'}));
  localStorage.setItem('app_theme', 'dark');
  return 'seeded';
})()`;

// Kart modunda her kolonun (mobile:false hariç) etiketi kartta geçiyor mu?
const CHECK = (expected) => `(() => {
  const cards = document.querySelectorAll('main ul li [role], main ul li');
  const labels = [...document.querySelectorAll('main dl dt')].map((d) => d.textContent.trim());
  const unique = [...new Set(labels)];
  const missing = ${JSON.stringify(expected)}.filter((l) => !unique.includes(l));
  return JSON.stringify({ cardCount: document.querySelectorAll('main ul li').length, labels: unique, missing });
})()`;

const plan = [
  { type: 'emulate', features: [{ name: 'prefers-color-scheme', value: 'dark' }] },
  { type: 'viewport', w: 390, h: 844, dsf: 1 },
  { type: 'goto', url: BASE + '/login', wait: 6000 },
  { type: 'eval', label: 'seed', js: seed },
  { type: 'viewport', w: 390, h: 844, dsf: 2 },
  { type: 'goto', url: BASE + '/appointments', wait: 9000 },
  { type: 'eval', label: 'alan kontrolü appointments', js: CHECK(['Müşteri', 'Personel', 'Tarih / Saat', 'Tutar', 'Durum']) },
  { type: 'shot', out: 'screenshots/admin_panel/rd3_dark_appointments_390.png' },
  { type: 'goto', url: BASE + '/users', wait: 9000 },
  { type: 'eval', label: 'alan kontrolü users', js: CHECK(['Telefon', 'Rol', 'Kayıt Tarihi', 'Durum']) },
  { type: 'shot', out: 'screenshots/admin_panel/rd3_dark_users_390.png' },
  { type: 'goto', url: BASE + '/salons', wait: 9000 },
  { type: 'eval', label: 'alan kontrolü salons', js: CHECK(['Puan', 'Durum', 'Sahibi']) },
  { type: 'shot', out: 'screenshots/admin_panel/rd3_dark_salons_390.png' },
  { type: 'viewport', w: 1440, h: 900, dsf: 1 },
  { type: 'goto', url: BASE + '/appointments', wait: 9000 },
  { type: 'shot', out: 'screenshots/admin_panel/rd3_dark_appointments_1440.png' },
  { type: 'diag' },
];
module.exports = plan;
