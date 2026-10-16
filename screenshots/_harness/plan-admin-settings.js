const fs = require('fs');
const AT = fs.readFileSync(process.env.TEMP + '/admin_at.txt', 'utf8').trim();
const RT = fs.readFileSync(process.env.TEMP + '/admin_rt.txt', 'utf8').trim();
module.exports = [
  { type: 'viewport', w: 1440, h: 900, dsf: 1 },
  { type: 'goto', url: 'http://127.0.0.1:3001/login', wait: 2500 },
  { type: 'eval', js: `localStorage.setItem('access_token', ${JSON.stringify(AT)}); localStorage.setItem('refresh_token', ${JSON.stringify(RT)}); localStorage.setItem('user', JSON.stringify({fullName:'Admin',email:'admin@beautysalon.com',role:'ADMIN'})); 'seeded'`, label: 'seed' },
  { type: 'goto', url: 'http://127.0.0.1:3001/settings', wait: 6000 },
  { type: 'eval', js: `({href: location.href, title: document.title, h1: (document.querySelector('h1')||{}).textContent, navCount: document.querySelectorAll('nav a').length})`, label: 'settings-state' },
  { type: 'shot', out: 'screenshots/admin_panel/settings_after.png' },
  { type: 'diag', label: 'settings-diag' },
];
