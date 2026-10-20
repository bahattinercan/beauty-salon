# plans/admin — İndeks

| Dosya | Konu | Durum |
|---|---|---|
| **AP-001-mobile-design-port.md** | Admin paneli mobil tasarım diline (CA-019) uyarlamak: responsive kabuk, token sözleşmesi, UI primitifleri, kart/tablo modları | **UYGULANDI** (2026-10-21) — ölçülen önce→sonra tablosu + plan sapmaları §11'de |
| proposed-tokens.json | AP-001'in iki aday paleti (A rose / B mor) — `scripts/wcag_tokens.js --tokens ...` ile ölçülür | doğrulandı; **B (mor, mobil ile birebir) seçildi ve uygulandı** |
| dark-mode.md | Light/dark tema + token katmanı + `ThemeToggle` | UYGULANDI — AP-001 ile tamamlandı: `Sidebar` silindi (`SideRail`), dashboard token'da, `badge-*` 7 yerde kullanılıyor, tsx'te `dark:` varyantı 0 |

Ölçüm kapıları: `scripts/wcag_tokens.js` (kontrast — `--scope admin --strict` exit 0), çalışma zamanı/taşma/hedef: `screenshots/_harness/plan-admin-{mobile-audit,mobile-bisect,before-contrast}.js` (önce), `plan-admin-{redesign-verify,redesign-taps,taps-only,cardmode-check}.js` (sonra).

Not: `pnpm build` bu makinede registry erişimi yok (`ERR_PNPM_FETCH_401`) — bunun yerine `apps/admin_panel` içinde `npx tsc --noEmit && npx eslint src && npx next build` çalıştırıldı; üçü de temiz.

