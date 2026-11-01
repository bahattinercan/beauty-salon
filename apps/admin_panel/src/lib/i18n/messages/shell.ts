/**
 * `shell.*` — panel kabuğunun (ray, üst bar, çekmece) marka, oturum ve tema metinleri.
 *
 * Marka adı iki dilde de aynıdır; yine de anahtar olarak tutulur ki kabukta çeviri
 * dışı kullanıcı metni kalmasın.
 */
export const tr = {
  brand: 'Beauty Salon',
  product: 'Admin Panel',
  adminFallback: 'Admin',
  logout: 'Çıkış yap',
  theme: {
    label: 'Tema',
    light: 'Açık',
    dark: 'Koyu',
    system: 'Sistem',
  },
};

export const en: typeof tr = {
  brand: 'Beauty Salon',
  product: 'Admin Panel',
  adminFallback: 'Admin',
  logout: 'Sign out',
  theme: {
    label: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  },
};
