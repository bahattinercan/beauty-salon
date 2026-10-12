# Plan 4: Notification Controller

## Durum: ✅ tamamlandı (backend), customer_app tarafı uygulandı

`src/controllers/notification.controller.js` + route mevcut.
Handler'lar: `getMyNotifications`, `getUnreadCount`, `markRead`, `markAllRead`, `create`.

## Testler
`tests/notification.test.js`.

## Kalan
- Bildirim üretimi (randevu oluşturma/iptal, yorum) otomatik olarak tetiklenmiyor;
  `Appointment` create/cancel akışında `Notification.create` çağrısı yok.
- `apps/salon_app` bildirim ekranı yok.
