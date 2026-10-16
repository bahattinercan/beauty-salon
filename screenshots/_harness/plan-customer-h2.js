// customer_app — search behaviour, category filter, favorite toggle + persistence
const fs = require('fs');
const AT = fs.readFileSync('C:/Users/bahat/AppData/Local/Temp/cust_at.txt', 'utf8').trim();
const RT = fs.readFileSync('C:/Users/bahat/AppData/Local/Temp/cust_rt.txt', 'utf8').trim();
const OUT = 'screenshots/customer_app/';
const APP = 'http://127.0.0.1:8899/';

module.exports = [
  { type: 'viewport', w: 390, h: 844, dsf: 2 },
  { type: 'goto', url: APP + 'manifest.json', wait: 1200 },
  { type: 'geo', lat: 41.0082, lng: 28.9784 },
  { type: 'seed', pairs: { access_token: AT, refresh_token: RT } },
  { type: 'goto', url: APP, wait: 11000 },

  // search for an existing salon name
  { type: 'click', x: 148, y: 812, wait: 5000, label: 'nav Kesfet' },
  { type: 'click', x: 195, y: 40, wait: 900, label: 'search field' },
  { type: 'type', text: 'zen', wait: 3000 },
  { type: 'key', key: 'Enter', wait: 3500 },
  { type: 'shot', out: OUT + 'h05_search_zen.png' },
  { type: 'keys', key: 'Backspace', count: 5, wait: 2500 },
  { type: 'key', key: 'Enter', wait: 3500 },
  { type: 'shot', out: OUT + 'h05b_search_cleared.png' },

  // category filter
  { type: 'click', x: 208, y: 147, wait: 4000, label: 'chip Tirnak' },
  { type: 'shot', out: OUT + 'h06_discover_category.png' },
  { type: 'click', x: 106, y: 147, wait: 4000, label: 'chip Tumu' },

  // favorite toggle on home nearby card
  { type: 'click', x: 50, y: 812, wait: 5000, label: 'nav Ana Sayfa' },
  { type: 'click', x: 251, y: 429, wait: 3000, label: 'heart on card 1' },
  { type: 'shot', out: OUT + 'h07_favorite_toggled.png' },
  { type: 'click', x: 343, y: 812, wait: 4000, label: 'nav Profil' },
  { type: 'click', x: 195, y: 436, wait: 4500, label: 'Favorilerim' },
  { type: 'shot', out: OUT + 'h08_favorites_list.png' },
  { type: 'diag', label: 'favorites' },
];
