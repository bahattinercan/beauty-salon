// salon_app token sozlesmesi gorsel kaniti: light + dark, giris yapmis halde.
// Calistir: CDP_PORT=9466 node screenshots/_harness/drive.js screenshots/_harness/plan-salon-tokens.js
const fs = require('fs');
const T = process.env.TEMP;
const AT = fs.readFileSync(T + '/salon_at.txt', 'utf8').trim();
const RT = fs.readFileSync(T + '/salon_rt.txt', 'utf8').trim();
const APP = 'http://127.0.0.1:8897/';
const OUT = 'screenshots/salon_app/';

const seedWith = (theme) => ({
  type: 'seed',
  pairs: {
    access_token: AT,
    refresh_token: RT,
    user_id: 'b53e9d24-5f2f-404e-a038-4011c6307f79',
    user_name: 'Ayse Yilmaz',
    app_theme: theme,
  },
});

const plan = [
  { type: 'emulate', features: [{ name: 'prefers-color-scheme', value: 'light' }] },
  { type: 'viewport', w: 390, h: 844, dsf: 2 },
  { type: 'goto', url: APP, wait: 14000 },
  { type: 'shot', out: OUT + 'tk_login_light.png' },
  { type: 'eval', label: 'token yazi tipini oku', js: `(() => {
     const f = document.fonts; let pop = 0, other = [];
     for (const face of f) if (face.family.replace(/['"]/g,'') === 'Poppins') pop++; else other.push(face.family);
     return JSON.stringify({poppinsFaces: pop, other: [...new Set(other)].slice(0,4)});
  })()` },
  seedWith('light'),
  { type: 'goto', url: APP, wait: 18000 },
  { type: 'shot', out: OUT + 'tk_dashboard_light.png' },
  // profil sekmesi (alt navigasyon 4. ogelerden 4.'su degil; 5 ogeli cubukta sagdan ikinci)
  { type: 'click', x: 273, y: 810 },
  { type: 'wait', ms: 3500 },
  { type: 'shot', out: OUT + 'tk_profile_light.png' },
  { type: 'emulate', features: [{ name: 'prefers-color-scheme', value: 'dark' }] },
  seedWith('dark'),
  { type: 'goto', url: APP, wait: 18000 },
  { type: 'shot', out: OUT + 'tk_dashboard_dark.png' },
  { type: 'click', x: 273, y: 810 },
  { type: 'wait', ms: 3500 },
  { type: 'shot', out: OUT + 'tk_profile_dark.png' },
  { type: 'diag' },
];
module.exports = plan;
