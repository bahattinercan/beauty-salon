# 06 — İş kuralları (kodda doğrulanmış)

## Randevu oluşturma (`appointment.controller.js → create`)

Sıra önemli — kontroller bu sırayla çalışır:

1. **Hizmet:** `Service.findByPk(serviceId)` var ve `isActive` olmalı → yoksa 404 `Hizmet bulunamadı`
2. **Geçmiş tarih:** `date < bugün` → 400 `Geçmiş bir tarihe randevu alınamaz`
3. **endTime:** `startTime + service.durationMinutes` → `HH:MM` olarak hesaplanır (istemci vermez)
4. **Salon:** `isActive && isVerified` olmalı → yoksa 404 `Salon bulunamadı veya aktif değil`
5. **Çalışma saatleri:** `workingHours[dayOfWeek]` içinde `open ≤ start` ve `start + duration ≤ close` → aksi 400. Gün tanımı yoksa kontrol **atlanır** (kapalı güne randevu alınabilir).
6. **Çalışan:**
   - `StaffService` üzerinden bu hizmeti sunan, **bu salona ait** aktif çalışanlar aday listesi olur (`fullName ASC`).
   - `staffId` verilirse adaylar arasında olmalı → yoksa 400 `Bu çalışan seçilen hizmeti sunmuyor`
   - `staffId` verilmezse ("herhangi bir çalışan") ilk boş aday atanır; hiç boş yoksa 409 `Bu hizmeti sunan hiçbir çalışan seçilen saatte boş değil`
7. **Çakışma:** aynı çalışan için `PENDING`/`CONFIRMED` randevu aralığı kesişimi → 409
8. **Oluşturma:** `status = PENDING`, 201

> `serviceId`'nin `salonId` ile uyumu doğrulanmaz: başka bir salona ait hizmet, bu salonun çalışanına bağlanmışsa kabul edilir.

## Slot üretimi (`getAvailableSlots`)

- Salonun o günkü `open`–`close` aralığında **30 dk** aralıklarla slot üretilir
- `min + durationMinutes <= close` koşulunu sağlayan slotlar listelenir
- `PENDING`/`CONFIRMED` randevularla kesişenler `available: false`
- Gün kapalıysa veya `open` yoksa `[]`
- Yanıt: `[{ "time": "09:00", "available": true }, ...]`
- `staffId` opsiyonel değildir ama doğrulanır; `staffId` verilmezse `where: { staffId: undefined }` → Sequelize bu filtreyi yok sayar ve **tüm çalışanların** randevuları dikkate alınır.
- Route'ta `authenticate` **yoktur** → public.

## Durum geçişleri

```
PENDING   → CONFIRMED | CANCELLED
CONFIRMED → COMPLETED | CANCELLED | NO_SHOW
COMPLETED / CANCELLED / NO_SHOW → terminal (400 "Bu randevu üzerinde işlem yapılamaz")
```

- `COMPLETED` yalnız `date + endTime` geçmişse yapılabilir → aksi 400
- Durum değişikliği SALON_OWNER (sahiplik) veya ADMIN yapabilir
- İptal (`/cancel`) müşteri içindir: randevu ona ait olmalı ve `PENDING`/`CONFIRMED` olmalı; `reason` opsiyonel → `cancellation_reason`

## Yorum ve puanlama

Koşullar: randevu var (404), `COMPLETED` (400), randevu yorumcuya ait (403), randevuya yorum yok (400).

Yorum ve salon puanı **aynı transaction** içinde yazılır:

```
ratingAvg  = round(AVG(visible ratings) * 10) / 10
reviewCount = COUNT(visible ratings)
```

Yalnız `isVisible = true` yorumlar puanı etkiler. Admin görünürlüğü kapatınca puan **yeniden hesaplanmaz** — `ratingAvg` eski değerinde kalır.

Yanıt: `customer` (`id, fullName, avatarUrl`) ile birlikte döner.

## Soft delete politikası

| Varlık | Silme |
|---|---|
| Salon | `isActive = false` |
| Staff | `isActive = false` |
| Service | `isActive = false` |
| Product | `isActive = false` |
| Category | **Hard delete** (`destroy()`) |
| Notification | Hard delete |
| Review | Silinmez; `isVisible` toggle |

Liste endpoint'leri yalnız `isActive = true` kayıtları döner; detay endpoint'leri (`/services/:id`, `/products/:id`) soft-deleted kaydı da döner.

## Sahiplik kuralları

| Kaynak | Kontrol |
|---|---|
| Salon | `ownerId === req.user.id` (PATCH/DELETE'te ADMIN de geçerli) |
| Staff / Service / Product | `salon.ownerId === req.user.id` (ADMIN **değil**) |
| Appointment status | `salon.ownerId === req.user.id` veya ADMIN |
| Appointment cancel | `customerId === req.user.id` |
| Review reply | `salon.ownerId === req.user.id` |
| Notification | `user_id === req.user.id` |
| Salon listesi (`/appointments/salon/:id`) | **kontrol yok** — her SALON_OWNER her salonu okur |

## Near-by (yakındaki salonlar)

- Bounding box: `radius / 111.32` derece
- Haversine (R = 6371 km), 2 ondalık yuvarlama
- Yalnız `isActive && isVerified`
- Sonuç mesafeye göre sıralı, sonra sayfalı

## Sayfalama

`paginate(page, limit)`: `page ≥ 1`, `limit` 1–100 (default 20). `nearby` sayfalama bellekte (`slice`) yapılır.

## OTP kuralları

- 6 haneli `crypto.randomInt(100000, 999999)`
- bcrypt(10) ile hash'lenir, DB'de hash saklanır
- 10 dakika geçerli; süresi dolunca alanlar temizlenir
- E-posta/telefon değişikliğinde mevcut değerle aynıysa 400
- Kullanıcı e-posta değişikliğinde yeni adresin başka kullanıcıda olup olmadığı kontrol edilir → 409
