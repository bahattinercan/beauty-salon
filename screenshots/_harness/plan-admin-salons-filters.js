// AP-007 W5 — /salons filtre çubuğu: 1440/1280/390 yatay taşma + tek satır ölçümü.
//
// Çalıştırma (repo kökünden; panel :3001 canlı, API :3000 canlı):
//   chromium --headless=new --remote-debugging-port=9444 --no-sandbox --disable-gpu &
//   curl -sf http://127.0.0.1:9444/json/version   # hazır olana kadar bekle
//   CDP_PORT=9444 node screenshots/_harness/drive.js screenshots/_harness/plan-admin-salons-filters.js
//
// Ölçüm sözleşmesi (plan §6 W4/W5):
//   - Ekran görüntüsü **veri geldikten sonra** alınır: `table tbody tr > 0` (yeğlenen)
//     veya boş durum metni görünene kadar en fazla 20 sn beklenir (öncesinde
//     iskelet/boş tablo yakalanıyordu).
//   - Şehir filtresi DB'deki değerle birebir eşleşmeli: `İstanbul` (ASCII
//     `Istanbul` eşleşmiyor, tablo boş kalıyordu).
//   - Her genişlikte `documentElement.scrollWidth <= clientWidth` (yatay taşma yok).
//   - Tek satır: kontroller farklı yükseklikte olabildiği için "benzersiz top" tek
//     başına yanıltıcı. Tek satır = benzersiz dikey **merkez** sayısı 1 VE dikey
//     aralıklar kesişiyor (max(top) < min(bottom)).
//   - Çubuk yüksekliği <= 56px.
//   - Kanıt: screenshots/admin-salons-filters-{1440,1280,390}.png
//
// Not: token `/tmp/admin_at.txt`'ten okunur; yoksa API'ye login atılıp yazılır.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const BASE = process.env.ADMIN_BASE || 'http://127.0.0.1:3001';
const API = process.env.API_BASE || 'http://127.0.0.1:3000';

// Önbellekli token `/api/v1/admin/salons` ile doğrulanır: süresi geçmiş token
// sessizce 401'e düşüp tabloyu boş bırakıyordu ("boş durum" kapısı geçtiği için
// ölçüm geçerli görünüyordu). 401 → yeniden login.
function login() {
  const out = execSync(
    `curl -s -X POST ${API}/api/v1/auth/login -H 'Content-Type: application/json' ` +
      `-d '{"email":"admin@beautysalon.com","password":"Admin123!"}'`,
    { encoding: 'utf8' }
  );
  return JSON.parse(out).data.accessToken;
}

function tokenValid(token) {
  try {
    const code = execSync(
      `curl -s -o /dev/null -w '%{http_code}' '${API}/api/v1/admin/salons?page=1&limit=1' ` +
        `-H 'Authorization: Bearer ${token}'`,
      { encoding: 'utf8' }
    ).trim();
    return code === '200';
  } catch {
    return false;
  }
}

function adminToken() {
  const file = process.env.ADMIN_TOKEN_FILE || path.join(os.tmpdir(), 'admin_at.txt');
  let cached = '';
  try {
    cached = fs.readFileSync(file, 'utf8').trim();
  } catch {
    /* dosya yok → login */
  }
  if (cached && tokenValid(cached)) return cached;
  const token = login();
  fs.writeFileSync(file, token);
  return token;
}

// Görev tanımındaki URL: durum=onaylı, sehir=İstanbul, q=kuaf (değerler URL-encode edilir).
const TARGET =
  '/salons?durum=' +
  encodeURIComponent('onaylı') +
  '&sehir=' +
  encodeURIComponent('İstanbul') +
  '&q=' +
  encodeURIComponent('kuaf');

const seed = (token) => `(() => {
  localStorage.setItem('access_token', ${JSON.stringify(token)});
  localStorage.setItem('user', JSON.stringify({fullName:'Platform Admin',email:'admin@beautysalon.com',role:'ADMIN'}));
  localStorage.setItem('app_theme', 'light');
  return 'seeded';
})()`;

// Veri kapısı: tablo satırı VEYA boş durum metni; en fazla 20 sn (awaitPromise).
const WAIT_DATA = `(async () => {
  const t0 = Date.now();
  while (Date.now() - t0 < 20000) {
    const rows = document.querySelectorAll('table tbody tr').length;
    const empty = /salon bulunmad|kayıt yok|sonuç yok|Eşleşme yok|Henüz salon/i.test(document.body.innerText);
    if (rows > 0 || empty) return JSON.stringify({ rows, empty, waitedMs: Date.now() - t0 });
    await new Promise((r) => setTimeout(r, 200));
  }
  return JSON.stringify({ rows: 0, empty: false, timeout: true });
})()`;

// Filtre çubuğu kontrolleri: arama (input), şehir/puan/sıralama (select),
// durum + görünüm sekmeleri ([role=tab]). Görünmeyen düğümler sayılmaz.
const BAR = `(() => {
  const bar = document.querySelector('[role="group"][aria-label="Filtre çubuğu"]');
  if (!bar) return JSON.stringify({ error: 'filtre çubuğu bulunamadı' });
  const nodes = [...bar.querySelectorAll('input, select, [role="tab"]')]
    .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
  const rects = nodes.map((el) => el.getBoundingClientRect());
  const tops = rects.map((r) => Math.round(r.top));
  const bottoms = rects.map((r) => Math.round(r.bottom));
  const centers = rects.map((r) => Math.round(r.top + r.height / 2));
  const uniq = (a) => [...new Set(a)].sort((x, y) => x - y);
  const maxTop = Math.max(...tops);
  const minBottom = Math.min(...bottoms);
  const barRect = bar.getBoundingClientRect();
  // Kök neden #2: Tabs'ın negatif yatay margin'i arama input'unun üzerine biniyordu.
  // Kesişim = iki rect'in her iki eksende de örtüşmesi (0.5px tolerans).
  const inputEl = bar.querySelector('input');
  const firstTab = bar.querySelector('[role="tab"]');
  let overlap = null;
  if (inputEl && firstTab) {
    const a = inputEl.getBoundingClientRect();
    const b = firstTab.getBoundingClientRect();
    const xOverlap = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const yOverlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    overlap = {
      inputRight: Math.round(a.right),
      firstTabLeft: Math.round(b.left),
      xOverlapPx: Math.round(xOverlap),
      yOverlapPx: Math.round(yOverlap),
      intersects: xOverlap > 0.5 && yOverlap > 0.5,
    };
  }
  return JSON.stringify({
    overlap,
    controls: nodes.length,
    controlWidths: rects.map((r) => Math.round(r.width)),
    topValues: uniq(tops),
    centerValues: uniq(centers),
    uniqueCenterCount: uniq(centers).length,
    rangesOverlap: maxTop < minBottom,
    maxTop,
    minBottom,
    singleRow: uniq(centers).length === 1 && maxTop < minBottom,
    barWidth: Math.round(barRect.width),
    barHeight: Math.round(barRect.height),
    barHeightOk: Math.round(barRect.height) <= 56,
    chipButtons: document.querySelectorAll('[aria-label="Etkin filtreler"] button').length,
  });
})()`;

// Sayfa düzeyi yatay taşma + taşan düğümler (kanıt için ilk 5).
// Kendi yatay kaydırma kabında (overflow-x auto/scroll) kırpılan içerik taşma sayılmaz:
// li/button sağ kenarı kabın dışına düşebilir ama kullanıcı onu görmez.
const OVERFLOW = `(() => {
  const de = document.documentElement;
  const W = window.innerWidth;
  const clippedBy = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if ((cs.overflowX === 'auto' || cs.overflowX === 'scroll') && p.scrollWidth > p.clientWidth + 1) return p;
    }
    return null;
  };
  const offenders = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right > W + 1 || r.left < -1) {
      const clip = clippedBy(el);
      if (clip) continue;
      offenders.push({ tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 60), right: Math.round(r.right) });
    }
  }
  return JSON.stringify({
    innerWidth: W,
    clientWidth: de.clientWidth,
    scrollWidth: de.scrollWidth,
    overflow: de.scrollWidth - de.clientWidth,
    fits: de.scrollWidth <= de.clientWidth,
    offenders: offenders.slice(0, 5),
  });
})()`;

// Chip satırı: liste ile "N filtre etkin" özeti ayrı flex öğesi olmalı — örtüşme yok.
// Liste kendi içinde kayabilir (scrollWidth > clientWidth kabul), sayfayı taşırmamalı.
const CHIPS = `(() => {
  const list = document.querySelector('[aria-label="Etkin filtreler"]');
  const summary = document.querySelector('[aria-live="polite"]');
  if (!list || !summary) return JSON.stringify({ chips: 0, error: 'chip satırı yok' });
  const a = list.getBoundingClientRect();
  const b = summary.getBoundingClientRect();
  const xOverlap = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const yOverlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  const root = list.parentElement.getBoundingClientRect();
  return JSON.stringify({
    chips: list.children.length,
    listRect: { left: Math.round(a.left), right: Math.round(a.right), width: Math.round(a.width) },
    summaryRect: { left: Math.round(b.left), right: Math.round(b.right), top: Math.round(b.top) },
    summarySameRow: yOverlap > 0.5,
    overlapPx: Math.round(Math.max(0, Math.min(xOverlap, yOverlap))),
    intersects: xOverlap > 0.5 && yOverlap > 0.5,
    listScrolls: list.scrollWidth > list.clientWidth + 1,
    listScrollWidth: list.scrollWidth,
    listClientWidth: list.clientWidth,
    rowFitsPage: Math.round(root.right) <= window.innerWidth,
    rootRight: Math.round(root.right),
  });
})()`;

// Ölçüm adımı: taşma + tek satır + çubuk yüksekliği + chip satırı tek JSON'da.
const measure = (label) => `(() => {
  const over = ${OVERFLOW};
  const bar = ${BAR};
  const chips = ${CHIPS};
  return JSON.stringify({ width: '${label}', overflow: JSON.parse(over), bar: JSON.parse(bar), chips: JSON.parse(chips) });
})()`;

const plan = [
  { type: 'viewport', w: 1440, h: 900, dsf: 1 },
  { type: 'emulate', features: [{ name: 'prefers-color-scheme', value: 'light' }] },
  { type: 'goto', url: BASE + '/login', wait: 6000 },
  { type: 'eval', label: 'seed token', js: seed(adminToken()) },

  // 1) 1440px — tek satır + taşma yok
  { type: 'goto', url: BASE + TARGET, wait: 4000 },
  { type: 'eval', label: 'veri 1440', js: WAIT_DATA },
  { type: 'eval', label: 'ölçüm 1440', js: measure(1440) },
  { type: 'shot', out: 'screenshots/admin-salons-filters-1440.png' },

  // 2) 1280px — tek satır + taşma yok (lg eşiği hâlâ nowrap)
  { type: 'viewport', w: 1280, h: 900, dsf: 1 },
  { type: 'goto', url: BASE + TARGET, wait: 4000 },
  { type: 'eval', label: 'veri 1280', js: WAIT_DATA },
  { type: 'eval', label: 'ölçüm 1280', js: measure(1280) },
  { type: 'shot', out: 'screenshots/admin-salons-filters-1280.png' },

  // 3) 390px — yatay taşma yok (sarma serbest, kabul istisnası §5.3)
  { type: 'viewport', w: 390, h: 844, dsf: 2 },
  { type: 'goto', url: BASE + TARGET, wait: 4000 },
  { type: 'eval', label: 'veri 390', js: WAIT_DATA },
  { type: 'eval', label: 'ölçüm 390', js: measure(390) },
  { type: 'shot', out: 'screenshots/admin-salons-filters-390.png' },

  { type: 'diag' },
];

module.exports = plan;
