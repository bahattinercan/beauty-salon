/**
 * `pages.*` — Giriş, Kullanıcılar ve büyük sayfaların başlık metinleri.
 *
 * Kapsam bilinçli olarak dar: `login` (tüm görünen metinler), `users` (sayfa
 * başlığı, tablo kolonları, arama, boş durum, rol filtreleri ve işlem
 * butonları). Diğer sayfalarda YALNIZCA `PageHeader` başlık/alt başlığı burada;
 * sayfa gövdeleri (filtre/çip/kart metinleri) ayrı görevlerin kapsamında.
 *
 * `tr` metinleri bugünkü sayfa kopyasından birebir alınmıştır; sayfa kopyası
 * değişirse önce burası güncellenir. Yer tutucular `{count}`, `{pending}`,
 * `{active}` süslü parantezle yazılır (bkz. `translate`).
 */
export const tr = {
  login: {
    themeLabel: 'Tema',
    title: 'Admin Girişi',
    subtitle: 'Beauty Salon Yönetim Paneli',
    emailLabel: 'E-posta adresi',
    emailPlaceholder: 'admin@beautysalon.com',
    passwordLabel: 'Şifre',
    passwordPlaceholder: '••••••••',
    submit: 'Giriş yap',
    submitting: 'Giriş yapılıyor…',
    errorFailed: 'Giriş başarısız oldu',
    errorAdminOnly: 'Bu panele yalnızca Admin rolündeki kullanıcılar erişebilir',
    errorGeneric: 'Giriş yapılırken bir hata oluştu',
  },
  users: {
    title: 'Kullanıcı Yönetimi',
    subtitle: '{count} kullanıcı',
    refresh: 'Yenile',
    searchPlaceholder: 'İsim, e-posta veya telefon ara…',
    searchAriaLabel: 'Kullanıcı ara',
    filterAriaLabel: 'Rol filtresi',
    filterAll: 'Tümü',
    filterCustomers: 'Müşteriler',
    filterSalonOwners: 'Salon Sahipleri',
    columns: {
      user: 'Kullanıcı',
      phone: 'Telefon',
      role: 'Rol',
      createdAt: 'Kayıt Tarihi',
      status: 'Durum',
      actions: 'İşlem',
    },
    roles: {
      admin: 'Admin',
      salonOwner: 'Salon Sahibi',
      customer: 'Müşteri',
    },
    statusActive: 'Aktif',
    statusInactive: 'Pasif',
    activate: 'Aktifleştir',
    deactivate: 'Pasife al',
    emptyTitle: 'Kullanıcı bulunamadı',
    emptyDescription: 'Arama veya rol filtresini değiştirin.',
    errorLoad: 'Kullanıcılar yüklenirken bir hata oluştu',
    errorToggle: 'Durum güncellenemedi',
  },
  salons: {
    title: 'Salon Yönetimi',
    subtitle: '{count} salon · {pending} onay bekliyor',
  },
  appointments: {
    title: 'Randevu Yönetimi',
    subtitle: '{count} randevu · {pending} bekliyor',
  },
  categories: {
    title: 'Kategori Yönetimi',
    subtitle: '{count} kategori · {active} aktif',
  },
};

export const en: typeof tr = {
  login: {
    themeLabel: 'Theme',
    title: 'Admin Login',
    subtitle: 'Beauty Salon Management Panel',
    emailLabel: 'Email address',
    emailPlaceholder: 'admin@beautysalon.com',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    submit: 'Sign in',
    submitting: 'Signing in…',
    errorFailed: 'Login failed',
    errorAdminOnly: 'Only users with the Admin role can access this panel',
    errorGeneric: 'An error occurred while signing in',
  },
  users: {
    title: 'User Management',
    subtitle: '{count} users',
    refresh: 'Refresh',
    searchPlaceholder: 'Search by name, email or phone…',
    searchAriaLabel: 'Search users',
    filterAriaLabel: 'Role filter',
    filterAll: 'All',
    filterCustomers: 'Customers',
    filterSalonOwners: 'Salon Owners',
    columns: {
      user: 'User',
      phone: 'Phone',
      role: 'Role',
      createdAt: 'Registered',
      status: 'Status',
      actions: 'Action',
    },
    roles: {
      admin: 'Admin',
      salonOwner: 'Salon Owner',
      customer: 'Customer',
    },
    statusActive: 'Active',
    statusInactive: 'Inactive',
    activate: 'Activate',
    deactivate: 'Deactivate',
    emptyTitle: 'No users found',
    emptyDescription: 'Change the search or role filter.',
    errorLoad: 'An error occurred while loading users',
    errorToggle: 'Status could not be updated',
  },
  salons: {
    title: 'Salon Management',
    subtitle: '{count} salons · {pending} awaiting approval',
  },
  appointments: {
    title: 'Appointment Management',
    subtitle: '{count} appointments · {pending} pending',
  },
  categories: {
    title: 'Category Management',
    subtitle: '{count} categories · {active} active',
  },
};
