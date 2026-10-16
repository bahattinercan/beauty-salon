// customer_app — logged-out screens (login / register / forgot password)
const fs = require('fs');
const OUT = 'screenshots/customer_app/';
const APP = 'http://127.0.0.1:8899/';

module.exports = [
  { type: 'viewport', w: 390, h: 844, dsf: 2 },
  { type: 'goto', url: APP + 'manifest.json', wait: 1200 },
  { type: 'eval', js: 'localStorage.clear(), location.hash', label: 'clear storage' },
  { type: 'goto', url: APP, wait: 11000 },
  { type: 'shot', out: OUT + 'm15_login.png' },
  { type: 'diag', label: 'login' },
];
