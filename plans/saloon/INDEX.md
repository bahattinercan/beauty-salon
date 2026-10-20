# plans/saloon — İndeks

| Dosya | Konu | Durum |
|---|---|---|
| **SA-001-token-contract-port.md** | salon_app renk sözleşmesi: `static const AppColors` + `AppThemeColors` + TemaData içi ham hex üçlüsünü tek `AppColors.of(context)` sözlüğüne indirmek (customer_app/AP-001 ile aynı token adları) | **UYGULANDI** (2026-10-21; ölçüm tablosu §3) |

Ölçüm kapıları: `apps/salon_app/test/app/theme/app_colors_test.dart` (25 kontrast/token testi),
`flutter analyze`, grep kapıları (ham `Color(0x…)` / `Colors.white` / statik `AppColors.X`).
Kareler: `screenshots/salon_app/tk_*.png`.
