/**
 * `lucide-react` test-yalnız stub'ı (AP-002 §5).
 *
 * `src/lib/nav.ts` ikon bileşenlerini import ediyor; gerçek paket kurulu değil.
 * Buradaki her ikon "hiçbir şey render etmeyen" bir fonksiyondur — nav testi
 * ikonun nasıl çizildiğini değil, NAV_ITEMS sözleşmesini (href/etiket/primary)
 * doğrular. UI doğrulaması bu kapının işi değildir (`screenshots/_harness`).
 *
 * KASITLI SINIR (AP-002 §10.2 — stub sürüklenmesi): `nav.ts` yeni bir ikon
 * import ederse bu dosyada karşılığı yoksa test GÜRÜLTÜLÜ patlar
 * ("does not provide an export named ..."). Bu bir hata değil, uyarıdır:
 * stub'ı güncelle, sessizce yeşile boyama.
 */

const icon = (name) => {
  const Icon = () => null;
  Object.defineProperty(Icon, 'displayName', { value: name });
  Object.defineProperty(Icon, 'iconName', { value: name });
  return Icon;
};

export const LayoutDashboard = icon('LayoutDashboard');
export const Store = icon('Store');
export const Users = icon('Users');
export const CalendarDays = icon('CalendarDays');
export const MessageSquare = icon('MessageSquare');
export const Tags = icon('Tags');
export const Settings = icon('Settings');
