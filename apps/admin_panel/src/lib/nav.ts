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
  label: string;
  icon: LucideIcon;
  /** Alt pill'de doğrudan görünür; diğerleri drawer'a gider. */
  primary?: boolean;
}

/**
 * Gezinmenin tek kaynağı: geniş ekranda sol ray (SideRail), dar ekranda alt pill
 * (BottomPillNav) + tam liste (MobileDrawer). Üçü de bu listeyi kullanır — yeni
 * bir sayfa eklerken üç ayrı yer güncellenmez.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Panel', icon: LayoutDashboard, primary: true },
  { href: '/salons', label: 'Salonlar', icon: Store, primary: true },
  { href: '/appointments', label: 'Randevular', icon: CalendarDays, primary: true },
  { href: '/users', label: 'Kullanıcılar', icon: Users, primary: true },
  { href: '/reviews', label: 'Yorumlar', icon: MessageSquare },
  { href: '/categories', label: 'Kategoriler', icon: Tags },
  { href: '/settings', label: 'Ayarlar', icon: Settings },
];

/** '/' dışındaki öğeler alt yollarla da eşleşir (/salons/123 → Salonlar aktif). */
export function isNavActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}
