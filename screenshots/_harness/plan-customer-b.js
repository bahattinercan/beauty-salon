// customer_app — profile sub-screens + snackbar persistence check (mobile 390x844).
const fs = require('fs');
const AT = fs.readFileSync('C:/Users/bahat/AppData/Local/Temp/cust_at.txt', 'utf8').trim();
const RT = fs.readFileSync('C:/Users/bahat/AppData/Local/Temp/cust_rt.txt', 'utf8').trim();
const OUT = 'screenshots/customer_app/';
const APP = 'http://127.0.0.1:8899/';

module.exports = [
  { type: 'viewport', w: 390, h: 844, dsf: 2 },
  { type: 'goto', url: APP + 'manifest.json', wait: 1200 },
  { type: 'seed', pairs: { access_token: AT, refresh_token: RT } },
  { type: 'goto', url: APP, wait: 12000 },
  // profile via bottom nav
  { type: 'click', x: 343, y: 812, wait: 4000, label: 'nav Profil' },
  // is the location snackbar persistent or transient?
  { type: 'wait', ms: 15000 },
  { type: 'shot', out: OUT + 'm09b_profile_late.png' },
  { type: 'eval', js: 'location.hash', label: 'route' },

  { type: 'click', x: 195, y: 598, wait: 4000, label: 'Bildirimler' },
  { type: 'shot', out: OUT + 'm12_notifications.png' },
  { type: 'click', x: 28, y: 28, wait: 2500, label: 'back' },

  { type: 'click', x: 195, y: 533, wait: 4000, label: 'Yorumlarim' },
  { type: 'shot', out: OUT + 'm11_my_reviews.png' },
  { type: 'click', x: 28, y: 28, wait: 2500, label: 'back' },

  { type: 'click', x: 195, y: 436, wait: 4000, label: 'Favorilerim' },
  { type: 'shot', out: OUT + 'm10_favorites.png' },
  { type: 'click', x: 28, y: 28, wait: 2500, label: 'back' },

  { type: 'click', x: 195, y: 388, wait: 4000, label: 'Profili Duzenle' },
  { type: 'shot', out: OUT + 'm13_edit_profile.png' },
  { type: 'click', x: 28, y: 28, wait: 2500, label: 'back' },

  { type: 'scroll', dy: 400, wait: 1800 },
  { type: 'shot', out: OUT + 'm14_profile_scrolled.png' },
  { type: 'diag', label: 'after profile flow' },
];
