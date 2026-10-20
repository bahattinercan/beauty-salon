// CA-019 WP5 — pill bottom nav kareleri: her aktif durum + içeriğin pill
// altında kalmadığını kanıtlayan "sona kaydırılmış" home karesi.
const fs = require('fs');
const T = 'C:/Users/bahat/AppData/Local/Temp/';
const AT = fs.readFileSync(T + 'cust_at.txt', 'utf8').trim();
const RT = fs.readFileSync(T + 'cust_rt.txt', 'utf8').trim();
const OUT = 'screenshots/customer_app/';
const APP = 'http://127.0.0.1:8899/';

// Pill: yatay margin 16, 4 eşit slot → merkezler ~61/152/242/332.
// Dikey: pill yüksekliği ~78 + 12 alt boşluk → ikon bandı ~790.
const NAV = [
  [61, 790, 'home'],
  [152, 790, 'discover'],
  [242, 790, 'appointments'],
  [332, 790, 'profile'],
];

const steps = [
  { type: 'viewport', w: 390, h: 844, dsf: 2 },
  { type: 'goto', url: APP + 'manifest.json', wait: 1500 },
  {
    type: 'seed',
    pairs: {
      access_token: AT,
      refresh_token: RT,
      onboarding_seen: 'true',
      app_theme: 'light',
    },
  },
  { type: 'goto', url: APP, wait: 15000 },
  // Home en alta kaydırılır: son kart pill'in üstünde kalmalı.
  { type: 'scroll', dy: 1400, wait: 1800, label: 'home kaydır 1' },
  { type: 'scroll', dy: 1400, wait: 2200, label: 'home kaydır 2' },
  { type: 'shot', out: OUT + 'rd12_home_light_bottom.png' },
];

for (const [x, y, name] of NAV) {
  steps.push({ type: 'click', x, y, wait: 6000, label: 'nav ' + name });
  steps.push({ type: 'shot', out: OUT + 'rd13_nav_active_' + name + '.png' });
}

steps.push({ type: 'diag', label: 'pill nav akışı' });

module.exports = steps;
