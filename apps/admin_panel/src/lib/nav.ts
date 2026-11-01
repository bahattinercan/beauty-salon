import {
  LayoutDashboard,
  Store,
  Users,
  CalendarDays,
  MessageSquare,
  Tags,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  /** Görünen etiketin i18n anahtarı (`nav.*`); metin `t(labelKey)` ile basılır. */
  labelKey: string;
  icon: LucideIcon;
  /** Alt pill'de doğrudan görünür; diğerleri drawer'a gider. */
  primary?: boolean;
}

/**
 * Gezinmenin tek kaynağı: geniş ekranda sol ray (SideRail), dar ekranda alt pill
 * (BottomPillNav) + tam liste (MobileDrawer). Üçü de bu listeyi kullanır — yeni
 * bir sayfa eklerken üç ayrı yer güncellenmez.
 *
 * Etiket artık metin değil anahtar: `src/lib/i18n/messages/nav.ts` (`tr`/`en`).
 */
export const NAV_ITEMS: NavItem[] = [
  { href: '/', labelKey: 'nav.panel', icon: LayoutDashboard, primary: true },
  { href: '/salons', labelKey: 'nav.salons', icon: Store, primary: true },
  { href: '/appointments', labelKey: 'nav.appointments', icon: CalendarDays, primary: true },
  { href: '/users', labelKey: 'nav.users', icon: Users, primary: true },
  { href: '/reviews', labelKey: 'nav.reviews', icon: MessageSquare },
  { href: '/categories', labelKey: 'nav.categories', icon: Tags },
  { href: '/settings', labelKey: 'nav.settings', icon: Settings },
];

/** '/' dışındaki öğeler alt yollarla da eşleşir (/salons/123 → Salonlar aktif). */
export function isNavActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}
