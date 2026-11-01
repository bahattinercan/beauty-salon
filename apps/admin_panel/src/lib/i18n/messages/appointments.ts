/**
 * `appointments.*` — Randevu Yönetimi sayfası ve randevuya özgü bileşenler
 * (`components/appointments/AppointmentActions`, `AppointmentDetailDialog`).
 *
 * Kapsam bilinçli olarak dar: yalnız randevuya özgü metinler. Ortak bileşenlerin
 * (Pagination, FilterChips, Badge) genel etiketleri burada DEĞİL, kendi
 * görevlerinde çevrilecek.
 *
 * `tr` metinleri bugünkü sayfa kopyasından birebir alınmıştır; sayfa kopyası
 * değişirse önce burası güncellenir. Yer tutucular `{count}`, `{label}`, `{name}`,
 * `{query}`, `{customer}`, `{date}`, `{verb}` süslü parantezle yazılır (bkz.
 * `translate`).
 *
 * Çip ve seçenek metinleri iki parçalıdır: şablon anahtarı (`chips.status` gibi)
 * + değer anahtarı (`status.PENDING` gibi). Saf modül (`lib/appointmentsQuery.ts`)
 * metin değil anahtar döndürür, sayfa `t(...)` ile basar.
 */
export const tr = {
  page: {
    refresh: 'Yenile',
    searchPlaceholder: 'Müşteri, salon, personel veya hizmet ara…',
    searchAriaLabel: 'Randevu ara',
    statusFilter: 'Durum',
    salonFilter: 'Salon',
    staffFilter: 'Personel',
    dateFilter: 'Tarih',
    sortFilter: 'Sıralama',
    allSalons: 'Tüm salonlar',
    allStaff: 'Tüm personel',
  },
  /** Durum adları: `tümü` panelde var, beşi API enum'u. */
  status: {
    all: 'Tümü',
    PENDING: 'Bekliyor',
    CONFIRMED: 'Onaylandı',
    COMPLETED: 'Tamamlandı',
    CANCELLED: 'İptal Edildi',
    NO_SHOW: 'Gelmedi',
  },
  /** Durum select seçeneği: etiket + filtresiz global sayaç. */
  statusOption: '{label} ({count})',
  sort: {
    newest: 'En yeni',
    dateAsc: 'Tarih (yakın)',
    dateDesc: 'Tarih (uzak)',
  },
  datePreset: {
    all: 'Tüm tarihler',
    today: 'Bugün',
    tomorrow: 'Yarın',
    thisWeek: 'Bu hafta',
    thisMonth: 'Bu ay',
    past: 'Geçmiş',
    upcoming: 'Gelecek',
  },
  chips: {
    status: 'Durum: {label}',
    salon: 'Salon: {name}',
    staff: 'Personel: {name}',
    date: 'Tarih: {label}',
    search: 'Arama: "{query}"',
    clear: 'Temizle',
  },
  columns: {
    salonService: 'Salon / Hizmet',
    customer: 'Müşteri',
    staff: 'Personel',
    when: 'Tarih / Saat',
    price: 'Tutar',
    status: 'Durum',
    actions: 'İşlem',
  },
  empty: {
    filteredTitle: 'Eşleşme yok',
    filteredDescription: 'Filtreleri temizleyip tekrar deneyin.',
    noneTitle: 'Randevu yok',
    noneDescription: 'Henüz randevu bulunmuyor.',
  },
  actions: {
    detail: 'Detay',
    confirm: 'Onayla',
    complete: 'Tamamla',
    noShow: 'Gelmedi',
    cancel: 'İptal',
  },
  detail: {
    title: 'Randevu detayı',
    close: 'Kapat',
    customer: 'Müşteri',
    salon: 'Salon',
    service: 'Hizmet',
    staff: 'Personel',
    when: 'Tarih / Saat',
    price: 'Tutar',
    status: 'Durum',
    note: 'Not',
    cancellationReason: 'İptal nedeni',
    createdAt: 'Oluşturma',
  },
  confirm: {
    defaultTitle: 'Randevu',
    back: 'Vazgeç',
    anonymousCustomer: 'Müşteri',
    /** `verb` = `statusActions.<eylem>.verb` anahtarının çevirisi. */
    message: '{customer} — {date} randevusu {verb}. Emin misiniz?',
  },
  /** Satır aksiyonu → onay başlığı, buton etiketi, uçuş sonrası bildirim. */
  statusActions: {
    confirm: {
      verb: 'onaylanacak',
      title: 'Randevuyu onayla',
      label: 'Onayla',
      success: 'Randevu onaylandı',
    },
    complete: {
      verb: 'tamamlanacak',
      title: 'Randevuyu tamamla',
      label: 'Tamamla',
      success: 'Randevu tamamlandı',
    },
    noShow: {
      verb: 'gelmedi olarak işaretlenecek',
      title: 'Gelmedi olarak işaretle',
      label: 'Gelmedi',
      success: 'Randevu gelmedi olarak işaretlendi',
    },
    cancel: {
      verb: 'iptal edilecek',
      title: 'Randevuyu iptal et',
      label: 'İptal et',
      success: 'Randevu iptal edildi',
    },
  },
  notice: {
    loadError: 'Randevular yüklenemedi',
    actionError: 'İşlem başarısız',
  },
};

export const en: typeof tr = {
  page: {
    refresh: 'Refresh',
    searchPlaceholder: 'Search by customer, salon, staff or service…',
    searchAriaLabel: 'Search appointments',
    statusFilter: 'Status',
    salonFilter: 'Salon',
    staffFilter: 'Staff',
    dateFilter: 'Date',
    sortFilter: 'Sort',
    allSalons: 'All salons',
    allStaff: 'All staff',
  },
  status: {
    all: 'All',
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    NO_SHOW: 'No-show',
  },
  statusOption: '{label} ({count})',
  sort: {
    newest: 'Newest',
    dateAsc: 'Date (soonest)',
    dateDesc: 'Date (furthest)',
  },
  datePreset: {
    all: 'All dates',
    today: 'Today',
    tomorrow: 'Tomorrow',
    thisWeek: 'This week',
    thisMonth: 'This month',
    past: 'Past',
    upcoming: 'Upcoming',
  },
  chips: {
    status: 'Status: {label}',
    salon: 'Salon: {name}',
    staff: 'Staff: {name}',
    date: 'Date: {label}',
    search: 'Search: "{query}"',
    clear: 'Clear',
  },
  columns: {
    salonService: 'Salon / Service',
    customer: 'Customer',
    staff: 'Staff',
    when: 'Date / Time',
    price: 'Amount',
    status: 'Status',
    actions: 'Action',
  },
  empty: {
    filteredTitle: 'No matches',
    filteredDescription: 'Clear the filters and try again.',
    noneTitle: 'No appointments',
    noneDescription: 'No appointments yet.',
  },
  actions: {
    detail: 'Details',
    confirm: 'Confirm',
    complete: 'Complete',
    noShow: 'No-show',
    cancel: 'Cancel',
  },
  detail: {
    title: 'Appointment details',
    close: 'Close',
    customer: 'Customer',
    salon: 'Salon',
    service: 'Service',
    staff: 'Staff',
    when: 'Date / Time',
    price: 'Amount',
    status: 'Status',
    note: 'Note',
    cancellationReason: 'Cancellation reason',
    createdAt: 'Created',
  },
  confirm: {
    defaultTitle: 'Appointment',
    back: 'Back',
    anonymousCustomer: 'Customer',
    message: '{customer} — the appointment on {date} will be {verb}. Are you sure?',
  },
  statusActions: {
    confirm: {
      verb: 'confirmed',
      title: 'Confirm appointment',
      label: 'Confirm',
      success: 'Appointment confirmed',
    },
    complete: {
      verb: 'completed',
      title: 'Complete appointment',
      label: 'Complete',
      success: 'Appointment completed',
    },
    noShow: {
      verb: 'marked as no-show',
      title: 'Mark as no-show',
      label: 'No-show',
      success: 'Appointment marked as no-show',
    },
    cancel: {
      verb: 'cancelled',
      title: 'Cancel appointment',
      label: 'Cancel',
      success: 'Appointment cancelled',
    },
  },
  notice: {
    loadError: 'Appointments could not be loaded',
    actionError: 'The action failed',
  },
};
