#!/usr/bin/env node
// Token kontrast denetleyicisi — tasarım iddiası değil, ölçüm.
//
// Token hexlerini KAYNAK DOSYALARINDAN okur (kendi kopyamızı tutmayız; aksi halde
// doğrulayıcı bir önceki tasarımı sertifikalar):
//   - apps/admin_panel/src/app/globals.css  (:root { ... } ve .dark { ... })
//   - apps/customer_app/lib/app/theme/app_colors.dart (static const AppColors light/dark)
//
// Çalıştırma (repo kökünden):
//   node scripts/wcag_tokens.js                                      -> mevcut admin + mevcut mobil
//   node scripts/wcag_tokens.js --scope admin --strict               -> yalnizca admin; esik alti 0 olmali
//   node scripts/wcag_tokens.js --tokens plans/admin/proposed-tokens.json -> oneri paletlerini uygulamadan dogrula
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

/* ---------- WCAG 2.x göreli parlaklık / kontrast ---------- */
const hexToRgb = (h) => {
  let s = String(h).trim().replace('#', '');
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
};
const lum = (rgb) => {
  const c = rgb.map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return +((x + 0.05) / (y + 0.05)).toFixed(2);
};
const grade = (r) => (r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA-large' : 'FAIL');

/* ---------- tokenları kaynak dosyalardan oku ---------- */
function readCssTokens(file, block) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const re = new RegExp('(^|\\n)\\s*' + block + '\\s*\\{([\\s\\S]*?)\\n\\}', 'm');
  const m = src.match(re);
  if (!m) throw new Error('block not found: ' + block + ' in ' + file);
  const out = {};
  for (const d of m[2].matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\b/g)) {
    const rgb = hexToRgb(d[2]);
    if (rgb) out[d[1]] = { hex: d[2], rgb };
  }
  return out;
}

function readDartTokens(file) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const out = { light: {}, dark: {} };
  for (const theme of ['light', 'dark']) {
    const m = src.match(new RegExp('static const AppColors ' + theme + ' = AppColors\\._\\(([\\s\\S]*?)\\n  \\);', 'm'));
    if (!m) continue;
    for (const d of m[1].matchAll(/(\w+):\s*Color\(0x([0-9A-Fa-f]{8})\)/g)) {
      const hex = '#' + d[2].slice(2);
      const rgb = hexToRgb(hex);
      if (rgb) out[theme][d[1]] = { hex, rgb };
    }
  }
  return out;
}

/* ---------- incelenecek çiftler (isim = "fg on bg") ---------- */
const ADMIN_PAIRS = [
  ['fg on background', '--fg', '--background'],
  ['fg on surface', '--fg', '--surface'],
  ['fg-muted on surface', '--fg-muted', '--surface'],
  ['fg-muted on background', '--fg-muted', '--background'],
  ['fg-subtle on surface', '--fg-subtle', '--surface'],
  ['fg-subtle on background', '--fg-subtle', '--background'],
  ['on-primary on primary', '--on-primary', '--primary'],
  ['on-primary on primary-solid', '--on-primary', '--primary-solid'],
  ['primary on surface (link/ikon)', '--primary', '--surface'],
  ['border vs surface (ayraç)', '--border', '--surface'],
  ['surface vs background (kart ayrımı)', '--surface', '--background'],
  ['border-strong vs surface', '--border-strong', '--surface'],
  ['on-accent-lime on accent-lime (lime CTA)', '--on-accent-lime', '--accent-lime'],
  ['accent-lime on surface (lime METİN)', '--accent-lime', '--surface'],
  ['on-nav-pill on nav-pill (koyu yan menü)', '--on-nav-pill', '--nav-pill'],
  ['fg on hero-surface', '--fg', '--hero-surface'],
  ['fg-muted on surface-variant', '--fg-muted', '--surface-variant'],
  ['error on surface', '--error', '--surface'],
  ['success on surface', '--success', '--surface'],
];

// Ayraç / kart ayrımı çiftleri metin değil; 4.5:1 beklemek anlamsız. Hedef alt sınırlar:
const SEPARATION_TARGETS = {
  'border vs surface (ayraç)': 1.3,
  'surface vs background (kart ayrımı)': 1.1,
  'border-strong vs surface': 1.4,
};
// Bilinçli olarak eşiğin altında kalması beklenen çiftler (kuralı belgelemek için matriste tutulur):
const EXPECTED_FAIL = new Set(['accent-lime on surface (lime METİN)']);

const MOBILE_PAIRS = [
  ['textPrimary on background', 'textPrimary', 'background'],
  ['textPrimary on surface', 'textPrimary', 'surface'],
  ['textSecondary on surface', 'textSecondary', 'surface'],
  ['textHint on surface', 'textHint', 'surface'],
  ['onPrimary on primary', 'onPrimary', 'primary'],
  ['onAccentLime on accentLime', 'onAccentLime', 'accentLime'],
  ['accentLime on surface (YASAK metin)', 'accentLime', 'surface'],
  ['onNavPill on navPill', 'onNavPill', 'navPill'],
  ['textPrimary on heroSurface', 'textPrimary', 'heroSurface'],
  ['surface vs background (kart ayrımı)', 'surface', 'background'],
  ['divider vs surface (ayraç)', 'divider', 'surface'],
];

const MOBILE_SEPARATION = {
  'divider vs surface (ayraç)': 1.1,
  'surface vs background (kart ayrımı)': 1.1,
};

function report(title, tokens, pairs, sepTargets) {
  const targets = sepTargets || SEPARATION_TARGETS;
  console.log('\n=== ' + title + ' ===');
  let fail = 0;
  for (const theme of ['light', 'dark']) {
    const t = tokens[theme];
    if (!t || !Object.keys(t).length) continue;
    console.log('-- ' + theme);
    for (const [label, fg, bg] of pairs) {
      const F = t[fg], B = t[bg];
      if (!F || !B) { console.log('   (eksik token: ' + (!F ? fg : bg) + ')'); continue; }
      const r = ratio(F.rgb, B.rgb);
      const target = targets[label];
      let verdict;
      if (target !== undefined) {
        verdict = r >= target ? 'ok' : 'ZAYIF';
        if (r < target && !EXPECTED_FAIL.has(label)) fail++;
        verdict += ' (>=' + target + ')';
      } else {
        verdict = grade(r);
        if (verdict === 'FAIL' && !EXPECTED_FAIL.has(label)) fail++;
      }
      console.log(
        '   ' + String(r).padStart(6) + '  ' + verdict.padEnd(14) + ' ' + label.padEnd(46) +
        F.hex + ' on ' + B.hex
      );
    }
  }
  return fail;
}

/* ---------- ek öneri paleti: JSON dosyasından (uygulama koduna dokanmadan dogrulama) ----------
   soyle calistirilir: node scripts/wcag_tokens.js --tokens plans/admin/proposed-tokens.json
   JSON: { "light": {"--fg": "#1E1B2E", ...}, "dark": { ... } }  (anahtarlar `--` onekli ya da degil) */
function readJsonPalettes(file) {
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
  const out = {};
  for (const [name, pal] of Object.entries(raw)) {
    out[name] = { light: {}, dark: {} };
    for (const theme of ['light', 'dark']) {
      for (const [k, v] of Object.entries((pal && pal[theme]) || {})) {
        const rgb = hexToRgb(v);
        // CSS token adlandirmasi ADMIN_PAIRS ile ayni kalsin diye `--` onekini koru.
        if (rgb) out[name][theme][k.startsWith('--') ? k : '--' + k] = { hex: String(v), rgb };
      }
    }
  }
  return out;
}

const strict = process.argv.includes('--strict');
const admin = { light: readCssTokens('apps/admin_panel/src/app/globals.css', ':root'), dark: readCssTokens('apps/admin_panel/src/app/globals.css', '\\.dark') };
const mobile = readDartTokens('apps/customer_app/lib/app/theme/app_colors.dart');

let fail = 0;
// --scope admin|mobile|all (varsayilan all): kapsam disi uygulamanin bilinen borcu
// kapiciyi kirilma noktasi yapmasin.
const si = process.argv.indexOf('--scope');
const scope = si > -1 ? (process.argv[si + 1] || 'all') : 'all';
if (scope === 'all' || scope === 'admin') fail += report('admin_panel  (globals.css — MEVCUT)', admin, ADMIN_PAIRS);
if (scope === 'all' || scope === 'mobile') fail += report('customer_app (app_colors.dart — MOBİL)', mobile, MOBILE_PAIRS, MOBILE_SEPARATION);

const ti = process.argv.indexOf('--tokens');
if (ti > -1 && process.argv[ti + 1] && (scope === 'all' || scope === 'admin')) {
  const palettes = readJsonPalettes(process.argv[ti + 1]);
  for (const [name, tokens] of Object.entries(palettes)) {
    fail += report('öneri paleti: ' + name, tokens, ADMIN_PAIRS);
  }
}

console.log('\nEşik altı çift (metin 4.5:1 + yüzey ayrımı hedefleri): ' + fail);
if (strict && fail > 0) process.exit(1);
