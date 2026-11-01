/**
 * `nav.*` — gezinme menü öğeleri ve gezinme bölgelerinin erişilebilirlik adları.
 *
 * `src/lib/nav.ts` içindeki `NAV_ITEMS[].labelKey` bu ağacın yapraklarını gösterir;
 * SideRail / BottomPillNav / MobileDrawer etiketi `t(labelKey)` ile basar.
 * `aria.*` anahtarları `aria-label` / `title` metinleridir (görünmez ama çevrilir).
 */
export const tr = {
  panel: 'Panel',
  salons: 'Salonlar',
  appointments: 'Randevular',
  users: 'Kullanıcılar',
  reviews: 'Yorumlar',
  categories: 'Kategoriler',
  settings: 'Ayarlar',
  more: 'Daha fazla',
  aria: {
    main: 'Ana gezinme',
    quick: 'Hızlı gezinme',
    all: 'Tüm gezinme',
    drawer: 'Gezinme menüsü',
    open: 'Menüyü aç',
    close: 'Menüyü kapat',
    dismiss: 'Kapat',
  },
};

export const en: typeof tr = {
  panel: 'Dashboard',
  salons: 'Salons',
  appointments: 'Appointments',
  users: 'Users',
  reviews: 'Reviews',
  categories: 'Categories',
  settings: 'Settings',
  more: 'More',
  aria: {
    main: 'Main navigation',
    quick: 'Quick navigation',
    all: 'All navigation',
    drawer: 'Navigation menu',
    open: 'Open menu',
    close: 'Close menu',
    dismiss: 'Close',
  },
};
