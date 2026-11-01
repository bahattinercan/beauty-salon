# plans/saloon — İndeks

| Dosya | Konu | Durum |
|---|---|---|
| **SA-001-token-contract-port.md** | salon_app renk sözleşmesi: `static const AppColors` + `AppThemeColors` + TemaData içi ham hex üçlüsünü tek `AppColors.of(context)` sözlüğüne indirmek (customer_app/AP-001 ile aynı token adları) | **UYGULANDI** (2026-10-21; ölçüm tablosu §3) |
| **SA-002-lux-editorial-tokens.md** | LX-001 Luxury Editorial token geçişi: salon_app `AppColors` light/dark değerlerini yeni palete çekmek, radius ölçeğini sertleştirmek (kart 2 · buton 4 · input 2) ve §8.1/§8.3 dokümanını eşitlemek | **UYGULANDI** (2026-10-29) |
| **SA-003-radius-normalize.md** | Radius normalizasyonu: `app_theme.dart` chip 20 → 6, ekran içi sabit radius'lar (login 22/16/14, appointments 16/14/12, register 12) ve alt gezinme hapı 999 istisnasının tek ölçeğe bağlanması | **UYGULANDI** (2026-10-29, commit yok, worker task_f360b5bff4cc, 66 satır radius normalizasyonu) |

Ölçüm kapıları: `apps/salon_app/test/app/theme/app_colors_test.dart` (16 kontrast/token testi),
`flutter analyze`, grep kapıları (ham `Color(0x…)` / `Colors.white` / statik `AppColors.X`).
Kareler: `screenshots/salon_app/tk_*.png`.
