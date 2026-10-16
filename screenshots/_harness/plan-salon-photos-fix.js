const fs = require('fs');
const AT = fs.readFileSync('C:/Users/bahat/AppData/Local/Temp/salon_at.txt', 'utf8').trim();
const RT = fs.readFileSync('C:/Users/bahat/AppData/Local/Temp/salon_rt.txt', 'utf8').trim();
const OUT = 'screenshots/salon_app/';
const APP = 'http://127.0.0.1:8901/';
module.exports = [
  { type: 'viewport', w: 390, h: 844, dsf: 2 },
  { type: 'goto', url: APP + 'manifest.json', wait: 1500 },
  { type: 'seed', pairs: { access_token: AT, refresh_token: RT, user_id: 'b53e9d24-5f2f-404e-a038-4011c6307f79', user_name: 'Ayşe Yılmaz' } },
  { type: 'goto', url: APP, wait: 12000 },
  { type: 'shot', out: OUT + 'fix01_start.png' },
  { type: 'click', x: 351, y: 819, wait: 5000, label: 'nav Salonum' },
  { type: 'shot', out: OUT + 'fix02_salonum.png' },
  { type: 'scroll', dy: 420, wait: 2000 },
  { type: 'shot', out: OUT + 'fix03_photos.png' },
  { type: 'scroll', dy: 260, wait: 2000 },
  { type: 'shot', out: OUT + 'fix04_photos2.png' },
  { type: 'diag', label: 'salon profile photos' },
];
