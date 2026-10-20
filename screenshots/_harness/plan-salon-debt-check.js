// SA-001 borc kapanisi sonrasi kanit: font gercekten yukleniyor mu + light/dark kareler.
// Calistir: CDP_PORT=9466 node screenshots/_harness/drive.js screenshots/_harness/plan-salon-debt-check.js
const fs = require('fs');
const T = process.env.TEMP;
const AT = fs.readFileSync(T + '/salon_at.txt', 'utf8').trim();
const RT = fs.readFileSync(T + '/salon_rt.txt', 'utf8').trim();
const APP = 'http://127.0.0.1:8897/';
const OUT = 'screenshots/salon_app/';

const seed = (theme) => ({
  type: 'seed',
  pairs: {
    access_token: AT, refresh_token: RT,
    user_id: 'b53e9d24-5f2f-404e-a038-4011c6307f79',
    user_name: 'Ayse Yilmaz', app_theme: theme,
  },
});

// FontManifest + document.fonts ile Poppins'in gercekten yuklendigini olc.
const FONT = `(async () => {
  const manifest = await (await fetch('assets/FontManifest.json')).json();
  const poppins = manifest.flatMap((f) => f.fonts || []).filter((f) => /Poppins/.test(f.asset));
  await document.fonts.ready;
  return JSON.stringify({
    manifestStatus: 'ok',
    poppinsFacesInManifest: poppins.length,
    faces: poppins.map((f) => f.asset.split('/').pop() + ':' + (f.weight || 400)),
    fontsStatus: document.fonts.status,
    checkRegular: document.fonts.check('16px Poppins'),
    checkSemiBold: document.fonts.check('600 16px Poppins'),
    checkBold: document.fonts.check('700 16px Poppins'),
  });
})()`;

const plan = [
  { type: 'emulate', features: [{ name: 'prefers-color-scheme', value: 'light' }] },
  { type: 'viewport', w: 390, h: 844, dsf: 2 },
  seed('light'),
  { type: 'goto', url: APP, wait: 18000 },
  { type: 'eval', label: 'poppins yukleniyor mu', js: FONT },
  { type: 'shot', out: OUT + 'tk2_dashboard_light.png' },
  { type: 'scroll', x: 195, y: 400, dy: 600 },
  { type: 'wait', ms: 1500 },
  { type: 'shot', out: OUT + 'tk2_dashboard_light_scrolled.png' },
  { type: 'emulate', features: [{ name: 'prefers-color-scheme', value: 'dark' }] },
  seed('dark'),
  { type: 'goto', url: APP, wait: 18000 },
  { type: 'shot', out: OUT + 'tk2_dashboard_dark.png' },
  { type: 'diag' },
];
module.exports = plan;
