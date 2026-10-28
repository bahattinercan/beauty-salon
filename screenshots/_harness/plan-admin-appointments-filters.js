// AP-008 W4 — /appointments filtre çubuğu: 1440/1280/390 yatay taşma + tek satır ölçümü.
//
// Çalıştırma (repo kökünden; API :3000 canlı, panel KENDİ izole portunda):
//   (cd apps/admin_panel && npx next start -p 3010 > /tmp/ap008-panel.log 2>&1 &)
//   /usr/bin/chromium --headless=new --remote-debugging-port=9455 --no-sandbox \
//     --disable-gpu --user-data-dir=/tmp/ap008-chromium &
//   ADMIN_BASE=http://127.0.0.1:3010 API_BASE=http://127.0.0.1:3000 CDP_PORT=9455 \
//     node screenshots/_harness/drive.js screenshots/_harness/plan-admin-appointments-filters.js
//
// Not: CDP portu 9444 DEĞİL — o portta başka bir sürecin chromium'u dinliyor
// (ss -ltnp). Ölçüm kendi chromium'umuzu ister: yabancı bir oturumun sayfasını
// sürmek onun çalışmasını bozar.
//
// Ölçüm sözleşmesi (AP-008 §5.3, AP-007 W5 ile aynı):
//   - Ekran görüntüsü **veri geldikten sonra** alınır: `table tbody tr > 0` (yeğlenen)
//     veya boş durum metni görünene kadar en fazla 20 sn beklenir.
//   - Her genişlikte `documentElement.scrollWidth <= clientWidth` (yatay taşma yok).
//   - Tek satır: kontroller farklı yükseklikte olabildiği için "benzersiz top" tek
//     başına yanıltıcı. Tek satır = benzersiz dikey **merkez** sayısı 1 VE dikey
//     aralıklar kesişiyor (max(top) < min(bottom)).
//   - Çubuk yüksekliği <= 56px.
//   - Arama input'u ile ilk sekme kesişmiyor (Tabs'ın negatif margin dersi).
//   - Kanıt: screenshots/admin-appointments-filters-{1440,1280,390}.png
//
// Token `/tmp/admin_at.txt`'ten okunur (salons harness'ı ile aynı dosya); süresi
// geçmişse `/api/v1/admin/appointments` 401 döner ve yeniden login atılır.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const BASE = process.env.ADMIN_BASE || 'http://127.0.0.1:3010';
const API = process.env.API_BASE || 'http://127.0.0.1:3000';

function login() {
  const out = execSync(
    `curl -s -X POST ${API}/api/v1/auth/login -H 'Content-Type: application/json' ` +
      `-d '{"email":"admin@beautysalon.com","password":"Admin123!"}'`,
    { encoding: 'utf8' }
  );
  return JSON.parse(out).data.accessToken;
}

// Önbellekli token gerçek uçla doğrulanır: süresi geçmiş token sessizce 401'e
// düşüp tabloyu boş bırakıyor ("boş durum" kapısı geçtiği için ölçüm geçerli
// görünüyordu) — salons harness'ındaki ders.
function tokenValid(token) {
  try {
    const code = execSync(
      `curl -s -o /dev/null -w '%{http_code}' '${API}/api/v1/admin/appointments?page=1&limit=1' ` +
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

// Hedef: durum=COMPLETED → filtre çubuğu chip'li, tablo dolu, sayaçlar global.
const TARGET = '/appointments?durum=COMPLETED';

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
    const empty = /Randevu yok|Eşleşme yok|randevu bulunmuyor|Filtreleri temizleyip/i.test(document.body.innerText);
    if (rows > 0 || empty) return JSON.stringify({ rows, empty, waitedMs: Date.now() - t0 });
    await new Promise((r) => setTimeout(r, 200));
  }
  return JSON.stringify({ rows: 0, empty: false, timeout: true });
})()`;

// Filtre çubuğu kontrolleri: arama (input), salon/personel/tarih/sıralama (select),
// durum sekmeleri ([role=tab]). Görünmeyen düğümler sayılmaz.
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
  // T9: 4 Select ~40px'e çöküyordu ("Tü…", "En…"). Genişlik + kırpılma ölçümü:
  // selectWidths/minSelectWidth doğrudan genişliği, selectsClipped native select'in
  // scrollWidth'i ile kırpılmayı verir. Native select scrollWidth'i Chromium'da her
  // zaman clientWidth'e eşit çıkabildiği için ayrıca metnin gerçekten sığıp
  // sığmadığı canvas ile ölçülür (selectsTextFits) — asıl kanıt o.
  const selects = [...bar.querySelectorAll('select')];
  const selectWidths = selects.map((el) => Math.round(el.getBoundingClientRect().width));
  const canvas = document.createElement('canvas').getContext('2d');
  const selectText = selects.map((el) => {
    const cs = getComputedStyle(el);
    if (canvas) canvas.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    const text = el.options[el.selectedIndex] ? el.options[el.selectedIndex].text : '';
    const textWidth = canvas ? Math.ceil(canvas.measureText(text).width) : 0;
    const needed = Math.ceil(textWidth + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight));
    return {
      text,
      textWidth,
      needed,
      clientWidth: Math.round(el.clientWidth),
      scrollWidth: Math.round(el.scrollWidth),
      fits: needed <= el.clientWidth + 1,
    };
  });
  const barChildren = [...bar.children].map((el) => Math.round(el.getBoundingClientRect().width));
  // Tabs'ın negatif yatay margin'i arama input'unun üzerine binebilir (AP-007 kök
  // neden #2). Kesişim = iki rect'in her iki eksende de örtüşmesi (0.5px tolerans).
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
    barChildren,
    selectWidths,
    minSelectWidth: selectWidths.length ? Math.min(...selectWidths) : 0,
    selectsClipped: selects.some((el) => el.scrollWidth > el.clientWidth + 1),
    selectsTextFits: selectText.every((item) => item.fits),
    selectText,
    chipButtons: document.querySelectorAll('[aria-label="Etkin filtreler"] button').length,
  });
})()`;

// Sayfa düzeyi yatay taşma + taşan düğümler (kanıt için ilk 5).
// Kendi yatay kaydırma kabında (overflow-x auto/scroll) kırpılan içerik taşma
// sayılmaz: sekme şeridi kendi içinde kayar, sayfayı taşırmaz.
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
const CHIPS = `(() => {
  const list = document.querySelector('[aria-label="Etkin filtreler"]');
  const summary = list ? list.parentElement.parentElement.querySelector('[aria-live="polite"]') : null;
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
  { type: 'shot', out: 'screenshots/admin-appointments-filters-1440.png' },

  // 2) 1280px — tek satır + taşma yok (lg eşiği hâlâ nowrap)
  { type: 'viewport', w: 1280, h: 800, dsf: 1 },
  { type: 'goto', url: BASE + TARGET, wait: 4000 },
  { type: 'eval', label: 'veri 1280', js: WAIT_DATA },
  { type: 'eval', label: 'ölçüm 1280', js: measure(1280) },
  { type: 'shot', out: 'screenshots/admin-appointments-filters-1280.png' },

  // 3) 390px — yatay taşma yok (sarma serbest, kabul istisnası §5.3)
  { type: 'viewport', w: 390, h: 844, dsf: 2 },
  { type: 'goto', url: BASE + TARGET, wait: 4000 },
  { type: 'eval', label: 'veri 390', js: WAIT_DATA },
  { type: 'eval', label: 'ölçüm 390', js: measure(390) },
  { type: 'shot', out: 'screenshots/admin-appointments-filters-390.png' },

  { type: 'diag' },
];

module.exports = plan;
