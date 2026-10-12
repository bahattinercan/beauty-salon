# Plan 1: Service Controller

## Durum: ✅ tamamlandı

`src/controllers/service.controller.js` + `src/routes/service.routes.js` mevcut.
Handler'lar: `getBySalon`, `create`, `getById`, `update`, `remove`.
Salon alt rotası: `GET/POST /salons/:salonId/services`.

## Testler
`tests/service-staff.test.js` — POST/GET/PATCH/DELETE + yetki (owner vs başkası) senaryoları.

## Kalan
- `isActive` soft delete davranışı test edilmiyor.
