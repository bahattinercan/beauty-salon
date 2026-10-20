// CA-019 WP7 — onboarding akışı (giriş yok, bayrak yok: ilk açılış gibi).
const OUT = 'screenshots/customer_app/';
const APP = 'http://127.0.0.1:8899/';

module.exports = [
  { type: 'viewport', w: 390, h: 844, dsf: 2 },
  { type: 'goto', url: APP + 'manifest.json', wait: 1500 },
  // master key yeniden üretilir; onboarding_seen ve token anahtarları okunmaz hale gelir
  { type: 'seed', pairs: {} },
  { type: 'goto', url: APP, wait: 15000 },
  { type: 'shot', out: OUT + 'rd06_onboarding_1.png' },
  { type: 'click', x: 341, y: 791, wait: 1500, label: 'lime ileri butonu' },
  { type: 'shot', out: OUT + 'rd07_onboarding_2.png' },
  { type: 'click', x: 341, y: 791, wait: 1500, label: 'lime ileri butonu' },
  { type: 'shot', out: OUT + 'rd08_onboarding_3.png' },
  { type: 'click', x: 341, y: 791, wait: 4000, label: 'başla (tik)' },
  { type: 'shot', out: OUT + 'rd09_login_after_onboarding.png' },
  { type: 'diag', label: 'onboarding flow' },
];
