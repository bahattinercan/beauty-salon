# AGENTS.md — Beauty Salon

> Bu dosya yerel ve sürümlenmemiş olabilir; git durumunu kontrol et.

## Yapı

`apps/api` (Node · Express · Sequelize · mocha+chai) · `apps/admin_panel` (Next.js) · `apps/customer_app` · `apps/salon_app` · `scripts/`
Kök `package.json` yok; her uygulama kendi bağımlılığını taşır. Uygulama kuralları: `apps/api`, `apps/customer_app`, `apps/salon_app` için `CLAUDE.md`; `apps/admin_panel` için `docs/ADMIN-PANEL.md`.

## Doğrulama (agent kapısı)

- Tek komut: `~/.pi/agent/bin/verify.sh` (hızlı: `--fast`) — `apps/*` altındaki `typecheck` + `lint` scriptlerini sırayla çalıştırır; tam modda `test` + `build`.
- Elle: `cd apps/admin_panel && npm run typecheck && npm run lint` · `cd apps/api && npm test`
- Not: `verify.sh` kökten çalıştırıldığında Flutter uygulamalarını kapsamaz (glob iki seviye derin `pubspec.yaml`'ı bulmuyor); Flutter için `cd apps/<app> && flutter analyze && flutter test` ayrı çalıştırılır.
- "Bitti" = dokunulan uygulamanın komutu yeşil ve çıktısı gösterildi. Doğrulanamadıysa `doğrulanmadı: <neden>` yaz.
- Pre-commit kapısı bu makinede `.git/hooks/pre-commit` altında kurulu; repoda sürümlenmiyor — yeni klonda elle kurulur. Bilinçli istisna `SKIP_VERIFY=1`.
