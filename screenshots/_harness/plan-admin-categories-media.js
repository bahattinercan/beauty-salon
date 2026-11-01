// AP-009 kapanış ölçümü — /categories tablosunun "Medya" hücresi GERÇEK seed
// verisiyle: görsel yüklendi mi (`naturalWidth > 0`), "Video" badge'i var mı,
// sayfada yatay taşma var mı (`scrollWidth == clientWidth`).
//
// Çalıştırma (repo kökünden; API :3100, panel KENDİ izole portunda :3011):
//   (cd apps/api && PORT=3100 node src/server.js > /tmp/api3100.log 2>&1 &)
//   (cd apps/admin_panel && NEXT_PUBLIC_API_URL=http://127.0.0.1:3100/api/v1 \
//      API_URL=http://127.0.0.1:3100 npx next start -p 3011 > /tmp/panel3011.log 2>&1 &)
//   "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new \
//     --remote-debugging-port=9456 --disable-gpu --user-data-dir=C:/Temp/ap009-chromium about:blank &
//   ADMIN_BASE=http://127.0.0.1:3011 API_BASE=http://127.0.0.1:3100 CDP_PORT=9456 \
//     node screenshots/_harness/drive.js screenshots/_harness/plan-admin-categories-media.js
//
// Not: :3000 bu makinede başka bir projenin (emlak) Next süreci tarafından
// tutuluyor; bu yüzden hem API hem panel izole portlarda çalışır. Admin parolası
// `apps/api/.env` içindeki SEED_ADMIN_PASSWORD'den okunur ve ÇIKTIYA YAZILMAZ.
//
// Ölçüm sözleşmesi (AP-007/AP-008/AP-010 harness'larıyla aynı):
//   - Ekran görüntüsü veri geldikten SONRA alınır (tablo satırı > 0 kapısı, 20 sn).
//   - `naturalWidth > 0` = görsel gerçekten çözüldü (404/CORP/kırık yol yakalanır).
//   - Yatay taşma: `documentElement.scrollWidth <= clientWidth`.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const BASE = process.env.ADMIN_BASE || 'http://127.0.0.1:3011';
const API = process.env.API_BASE || 'http://127.0.0.1:3100';

/** `apps/api/.env` → SEED_ADMIN_PASSWORD (boşsa seed'in dev varsayılanı; değer loglanmaz). */
function adminPassword() {
  const envPath = path.resolve(__dirname, '..', '..', 'apps', 'api', '.env');
  const line = fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find((l) => l.startsWith('SEED_ADMIN_PASSWORD='));
  if (!line) throw new Error('SEED_ADMIN_PASSWORD bulunamadı');
  const value = line.slice('SEED_ADMIN_PASSWORD='.length).trim();
  // .env'de boş bırakılmışsa seed.js'in dev varsayılanı devreye girer (DEV_DEFAULT_PASSWORDS).
  return value || 'Admin123!';
}

function login() {
  const payload = JSON.stringify({ email: 'admin@beautysalon.com', password: adminPassword() });
  // execFileSync: kabuk yok → Windows (cmd.exe) tırnak/quoting sorunu yok.
  const out = execFileSync(
    'curl',
    ['-s', '-X', 'POST', `${API}/api/v1/auth/login`, '-H', 'Content-Type: application/json', '-d', '@-'],
    { input: payload, encoding: 'utf8' }
  );
  const token = JSON.parse(out)?.data?.accessToken;
  if (!token) throw new Error('login başarısız: ' + out.slice(0, 200));
  return token;
}

const token = login();

const seedSession = `(() => {
  localStorage.setItem('access_token', ${JSON.stringify(token)});
  localStorage.setItem('user', JSON.stringify({fullName:'Platform Admin',email:'admin@beautysalon.com',role:'ADMIN'}));
  localStorage.setItem('app_theme', 'light');
  return 'seeded';
})()`;

// Veri kapısı: tablo satırı veya boş durum; en fazla 20 sn.
const WAIT_ROWS = `(async () => {
  const t0 = Date.now();
  while (Date.now() - t0 < 20000) {
    const rows = document.querySelectorAll('table tbody tr').length;
    const empty = /Eşleşme yok|kategori bulunamadı|Henüz kategori/i.test(document.body.innerText);
    if (rows > 0 || empty) return JSON.stringify({ rows, empty, waitedMs: Date.now() - t0 });
    await new Promise((r) => setTimeout(r, 200));
  }
  return JSON.stringify({ rows: 0, empty: false, timeout: true });
})()`;

// Medya hücresi: her satırda görsel + Video badge'i.
const MEDIA = `(() => {
  const rows = [...document.querySelectorAll('table tbody tr')];
  const out = rows.map((tr) => {
    const cells = [...tr.querySelectorAll('td')];
    const name = (cells[0]?.innerText || '').trim().split('\\n')[0];
    const cell = cells.find((td) => td.querySelector('img, span.badge, [class*="badge"]')) || cells[2];
    const img = tr.querySelector('img');
    const text = (cell?.innerText || '').trim();
    return {
      name,
      imgSrc: img ? img.getAttribute('src') : null,
      naturalWidth: img ? img.naturalWidth : 0,
      complete: img ? img.complete : false,
      videoBadge: /Video/i.test(text),
      cellText: text.slice(0, 40),
    };
  });
  const imgs = [...document.querySelectorAll('table tbody img')];
  return JSON.stringify({
    rowCount: rows.length,
    withImage: out.filter((r) => r.imgSrc).length,
    imagesLoaded: imgs.filter((i) => i.naturalWidth > 0).length,
    imagesBroken: imgs.filter((i) => i.complete && i.naturalWidth === 0).length,
    videoBadges: out.filter((r) => r.videoBadge).length,
    rows: out,
  });
})()`;

const OVERFLOW = `(() => {
  const de = document.documentElement;
  return JSON.stringify({
    width: window.innerWidth,
    docScrollWidth: de.scrollWidth,
    docClientWidth: de.clientWidth,
    horizontalOverflowPx: de.scrollWidth - de.clientWidth,
    noHorizontalOverflow: de.scrollWidth <= de.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
  });
})()`;

module.exports = [
  { type: 'viewport', w: 1280, h: 900, dsf: 1 },
  { type: 'goto', url: `${BASE}/login`, wait: 3000 },
  { type: 'eval', js: seedSession, label: 'session' },
  { type: 'goto', url: `${BASE}/categories`, wait: 6000 },
  { type: 'eval', js: WAIT_ROWS, label: 'rows-gate' },
  { type: 'eval', js: MEDIA, label: 'media' },
  { type: 'eval', js: OVERFLOW, label: 'overflow' },
  { type: 'diag' },
  { type: 'shot', out: process.env.SHOT_OUT || path.join('screenshots', 'admin-categories-media-1280.png') },
];
