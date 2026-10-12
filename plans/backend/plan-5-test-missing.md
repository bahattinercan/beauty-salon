# Plan 5: Test Eksikleri

## Durum: ✅ tamamlandı

Önceki durum: suite çalışmıyordu (syntax hatası + 124 geçersiz assertion).
Şimdi: 11 test dosyası, **243 test, 0 failing** (`npm test`).

Kapsanan alanlar: auth, user, salon, service+staff, appointment, review, favorite,
category, product, notification, admin dashboard.

## Kalan
- `POST /upload/single` ve `/upload/multiple` testi yok
- OTP akışının "confirm" kısmı salon testlerinde kısmen var; SMS yolu test edilmiyor
