/**
 * AP-011 K3 — API enum değerlerinin **tek kaynağı**.
 *
 * Neden: rol/durum değerleri panelde sayfa başına ayrı bir
 * `type X = 'A' | 'B'` birleşimi ve ayrı bir etiket haritasıyla tekrarlanıyordu.
 * Yeni bir API enum değeri eklendiğinde harita güncellenmezse arayüzde HAM DEĞER
 * (ya da boş etiket) görünüyordu. Artık zincir şöyle:
 *
 * 1. Değer listesi burada (`as const` dizi), tip diziden türetilir —
 *    aynı listeyi ikinci kez yazan bir birleşim kalmaz.
 * 2. Etiket/ton haritaları `components/ui/Badge.tsx` içinde
 *    `satisfies Record<AppointmentStatus, StatusMeta>` ile bu tiplere bağlıdır:
 *    eksik girdi DERLEME hatası verir (`npm run typecheck`).
 * 3. `tests/unit/components/StatusMaps.test.tsx` her kanonik değerin haritada,
 *    her `labelKey`'in tr **ve** en sözlüğünde karşılığı olduğunu doğrular.
 * 4. Haritada olmayan bir değer yine de gelirse `resolveStatusLabel` görünür
 *    fallback (`ui.badge.unknown` + ham değer) üretir; ham değer tek başına basılmaz.
 *
 * Saf modül: React yok, çeviri metni yok, `window` yok — yalnız değerler ve tipler.
 * Bu yüzden `node --test` (ağsız kapı) ve vitest aynı listeyi okuyabilir.
 */

/** Randevu durumu — `apps/api` `Appointment.status` enum'u (5 değer). */
export const APPOINTMENT_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/** Kullanıcı rolü — `apps/api` `User.role` enum'u (3 değer). */
export const USER_ROLES = ['ADMIN', 'SALON_OWNER', 'CUSTOMER'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/**
 * Salon durumu — API'de enum değil, panelde `isActive`/`isVerified`
 * alanlarından türetilir (`salons/page.tsx`). Yine de haritası tiplenir:
 * yeni bir durum eklenirse harita ve sözlük anahtarı birlikte güncellenmek zorunda.
 */
export const SALON_STATUSES = ['onaylı', 'bekliyor', 'pasif'] as const;
export type SalonStatus = (typeof SALON_STATUSES)[number];
