# 12 — Hızlı başlangıç (curl)

```bash
BASE=http://localhost:3200/api/v1     # .env PORT=3000; bu makinede 3200 ile çalışıyor
```

## Health

```bash
curl -s $BASE/health
```

## Kayıt + token

```bash
TOKEN=$(curl -s -X POST $BASE/auth/register -H 'Content-Type: application/json' \
  -d '{"email":"doc@example.com","password":"Test1234a","fullName":"Doc User"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).data.accessToken))")
```

Seed kullanıcıları ile giriş:

```bash
TOKEN=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"musteri@beautysalon.com","password":"Musteri123!"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).data.accessToken))")
```

Roller: `admin@beautysalon.com / Admin123!`, `salon@beautysalon.com / Salon123!`, `salon2@beautysalon.com / Salon123!`, `musteri@beautysalon.com / Musteri123!`.

## Kategoriler ve salonlar

```bash
curl -s $BASE/categories
curl -s "$BASE/salons?city=%C4%B0stanbul&sortBy=rating&limit=5"
curl -s "$BASE/salons/nearby?latitude=41.04&longitude=29.00&radius=5"
curl -s $BASE/salons/890cdc38-8761-414b-a377-3ba3b8ff18ff
curl -s $BASE/salons/890cdc38-8761-414b-a377-3ba3b8ff18ff/staff
curl -s $BASE/salons/890cdc38-8761-414b-a377-3ba3b8ff18ff/services
```

## Slot ve randevu

```bash
SALON=890cdc38-8761-414b-a377-3ba3b8ff18ff
STAFF=5a4ae24c-3710-43f8-bb3a-66a04dfcf6cf
SERVICE=a30bc9c4-346d-4e1d-89d3-bd046d7bf854
DATE=2026-11-06

curl -s "$BASE/appointments/available-slots?salonId=$SALON&staffId=$STAFF&serviceId=$SERVICE&date=$DATE"

curl -s -X POST $BASE/appointments -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d "{\"salonId\":\"$SALON\",\"staffId\":\"$STAFF\",\"serviceId\":\"$SERVICE\",\"date\":\"$DATE\",\"startTime\":\"10:00\",\"note\":\"İlk randevu\"}"

# staffId'sız (salon, hizmeti sunan boş bir çalışanı otomatik atar)
curl -s -X POST $BASE/appointments -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d "{\"salonId\":\"$SALON\",\"serviceId\":\"$SERVICE\",\"date\":\"$DATE\",\"startTime\":\"15:00\"}"
```

## Randevu durumu / iptal

```bash
# salon sahibi onaylar
curl -s -X PATCH $BASE/appointments/<id>/status -H "Authorization: Bearer $OWNER_TOKEN" \
  -H 'Content-Type: application/json' -d '{"status":"CONFIRMED"}'

# müşteri iptal eder
curl -s -X PATCH $BASE/appointments/<id>/cancel -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"reason":"Kişisel sebepler"}'
```

## Yorum

```bash
curl -s -X POST $BASE/reviews -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"appointmentId":"<COMPLETED randevu id>","rating":5,"comment":"Harika"}'
```

## Favori, bildirim, profil

```bash
curl -s -X POST $BASE/favorites/$SALON -H "Authorization: Bearer $TOKEN"
curl -s $BASE/favorites/$SALON/check -H "Authorization: Bearer $TOKEN"
curl -s "$BASE/notifications?isRead=false&type=APPOINTMENT" -H "Authorization: Bearer $TOKEN"
curl -s $BASE/notifications/unread-count -H "Authorization: Bearer $TOKEN"
curl -s $BASE/users/me -H "Authorization: Bearer $TOKEN"
```

## Dosya yükleme

```bash
curl -s -X POST $BASE/upload/single -H "Authorization: Bearer $TOKEN" -F "file=@logo.png"
# → { "success":true, "data": { "url":"/uploads/<uuid>.png", "originalName":"logo.png", "size":12345 } }
curl -s http://localhost:3200/uploads/<uuid>.png -o out.png
```

## Admin

```bash
ADMIN_TOKEN=$(curl -s -X POST $BASE/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@beautysalon.com","password":"Admin123!"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).data.accessToken))")

curl -s $BASE/admin/dashboard -H "Authorization: Bearer $ADMIN_TOKEN"
curl -s "$BASE/admin/salons?verified=false" -H "Authorization: Bearer $ADMIN_TOKEN"
curl -s $BASE/settings -H "Authorization: Bearer $ADMIN_TOKEN"
curl -s -X PUT $BASE/settings -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H 'Content-Type: application/json' -d '{"maintenanceModeEnabled":true}'
```

## Rate limit uyarısı

`/auth/login` ve `/auth/register` dakikada 10 istekle sınırlıdır. Script'lerde token'ı bir kez alıp yeniden kullanın; aksi halde 429 alırsınız (bu dokümantasyon için yapılan probe sırasında doğrulandı).
