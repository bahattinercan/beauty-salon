/**
 * `dashboard.*` — Panel sayfasının (`src/app/page.tsx`) görünen tüm metinleri:
 * başlık, hero kartı, istatistik kartı etiketleri, grafik başlıkları ve yorum listesi.
 *
 * Anahtar adları kısa ve tutarlıdır: `hero.*`, `stats.*`, `charts.*`, `reviews.*`.
 * Sayfayı bu anahtarlara bağlamak ayrı bir görevdir; bu dosya tek başına tamdır.
 */
export const tr = {
  title: 'Panel',
  refresh: 'Yenile',
  hero: {
    statusPending: 'Onay bekliyor',
    statusClear: 'Gündem yok',
    pendingHeadline: '{count} salon başvurusu onay bekliyor',
    pendingHeadline_one: '{count} salon başvurusu onay bekliyor',
    pendingHeadline_other: '{count} salon başvurusu onay bekliyor',
    clearHeadline: 'Bekleyen salon başvurusu yok',
    pendingDescription:
      'Onaylanan salonlar müşteri uygulamada hemen görünür; sırayı bozmamak için bugünkü başvuruları gözden geçirin.',
    clearDescription:
      'Yeni başvuru geldikçe burada görünecek. Randevu akışını izlemek için randevulara bakabilirsiniz.',
    reviewApplications: 'Başvuruları incele',
    viewAppointments: 'Randevuları gör',
    users: 'Kullanıcılar',
  },
  stats: {
    totalSalons: 'Toplam Salon',
    totalUsers: 'Toplam Kullanıcı',
    totalAppointments: 'Toplam Randevu',
    recentAppointmentsHint: '{count} son 30 gün',
    totalRevenue: 'Toplam Gelir',
    pendingSalons: 'Bekleyen Salon',
    completedAppointments: 'Tamamlanan Randevu',
    newUsersThisWeek: 'Bu Hafta Yeni Kullanıcı',
  },
  charts: {
    monthlyTitle: 'Aylık Randevu',
    monthlyDescription: 'Son 6 ay',
    statusTitle: 'Randevu Durumları',
  },
  reviews: {
    recentTitle: 'Son Yorumlar',
    viewAll: 'Tümünü gör',
    emptyTitle: 'Henüz yorum yok',
    emptyDescription: 'Onaylanan randevulardan sonra yorumlar burada birikir.',
  },
};

export const en: typeof tr = {
  title: 'Dashboard',
  refresh: 'Refresh',
  hero: {
    statusPending: 'Awaiting approval',
    statusClear: 'Nothing on the agenda',
    pendingHeadline: '{count} salon applications are awaiting approval',
    pendingHeadline_one: '{count} salon application is awaiting approval',
    pendingHeadline_other: '{count} salon applications are awaiting approval',
    clearHeadline: 'No salon applications awaiting approval',
    pendingDescription:
      'Approved salons appear in the customer app right away; review today’s applications so the queue keeps moving.',
    clearDescription:
      'New applications will show up here. Check appointments to follow the booking flow.',
    reviewApplications: 'Review applications',
    viewAppointments: 'View appointments',
    users: 'Users',
  },
  stats: {
    totalSalons: 'Total salons',
    totalUsers: 'Total users',
    totalAppointments: 'Total appointments',
    recentAppointmentsHint: '{count} in the last 30 days',
    totalRevenue: 'Total revenue',
    pendingSalons: 'Pending salons',
    completedAppointments: 'Completed appointments',
    newUsersThisWeek: 'New users this week',
  },
  charts: {
    monthlyTitle: 'Monthly appointments',
    monthlyDescription: 'Last 6 months',
    statusTitle: 'Appointment statuses',
  },
  reviews: {
    recentTitle: 'Recent reviews',
    viewAll: 'View all',
    emptyTitle: 'No reviews yet',
    emptyDescription: 'Reviews collect here after appointments are completed.',
  },
};
