# plans/admin — İndeks

| Dosya | Konu | Durum |
|---|---|---|
| **AP-001-mobile-design-port.md** | Admin paneli mobil tasarım diline (CA-019) uyarlamak **(mobil sonradan gereksiz çıktı — bkz. dosya başındaki kapsam düzeltmesi; token + AA + masaüstü kısmı geçerli): responsive kabuk, token sözleşmesi, UI primitifleri, kart/tablo modları | **UYGULANDI** (2026-10-21) — ölçülen önce→sonra tablosu + plan sapmaları §11'de |
| proposed-tokens.json | AP-001'in iki aday paleti (A rose / B mor) — `scripts/wcag_tokens.js --tokens ...` ile ölçülür | doğrulandı; **B (mor, mobil ile birebir) seçildi ve uygulandı** |
| dark-mode.md | Light/dark tema + token katmanı + `ThemeToggle` | UYGULANDI — AP-001 ile tamamlandı: `Sidebar` silindi (`SideRail`), dashboard token'da, `badge-*` 7 yerde kullanılıyor, tsx'te `dark:` varyantı 0 |
| **AP-002-test-strategy.md** | `apps/admin_panel` için **ağsız** test stratejisi: Node'un yerleşik `node:test` runner'ı + Node 22 yerleşik type-stripping (`node_modules` kurulumu gerekmeden `node --test` exit 0); vitest kararı ayrı bir kapı olarak bağımlılık kurulumu serbest olduğunda ayrıca verilecek | **YAZILDI** (2026-10-23) — 276 satır, 3 test hedefi (`cx.ts`, hook stub'ıyla `nav.ts`, `fetch`'i mock'lanmış API modülü) `/tmp/ap002probe/` scratch'inde fiilen doğrulandı; repoya yalnız bu `.md` yazıldı, uygulama dosyalarına dokunulmadı |

Ölçüm kapıları: `scripts/wcag_tokens.js` (kontrast — `--scope admin --strict` exit 0), çalışma zamanı/taşma/hedef: `screenshots/_harness/plan-admin-{mobile-audit,mobile-bisect,before-contrast}.js` (önce), `plan-admin-{redesign-verify,redesign-taps,taps-only,cardmode-check}.js` (sonra).

**Not (2026-10-21 — o gün geçerliydi):** `pnpm build` bu makinede registry erişimi yoktu (`ERR_PNPM_FETCH_401`) — bunun yerine `apps/admin_panel` içinde `npx tsc --noEmit && npx eslint src && npx next build` çalıştırıldı; üçü de temiz.

**Not (2026-10-23 ölçümü — güncel durum): registry erişimi VAR.** `npm ping` → PONG 264 ms, `https://registry.npmjs.org` → HTTP 200, `~/.npm/_cacache` 1,4 GB, `apps/api/node_modules` kurulu. Dolayısıyla `ERR_PNPM_FETCH_401` bugünkü durumda tekrarlanmıyor ve `pnpm build` artık erişimsizlik gerekçesiyle dışlanmış değil; AP-002'nin "ağsız kapı" tercihi de artık bir zorunluluk değil, `node_modules` kurulumu istenmeyen hızlı bir test kapısı tercihidir. (Bu oturumda kural gereği yeni bir kurulum/build/ağ çağrısı çalıştırılmadı: `~/.npm/_cacache` boyutu ve `apps/api/node_modules` varlığı bu oturumda yerinde (dosya sistemi üzerinden) doğrulandı; `npm ping` ve HTTP 200 değerleri 2026-10-23 ölçüm kaydından aktarıldı.)

