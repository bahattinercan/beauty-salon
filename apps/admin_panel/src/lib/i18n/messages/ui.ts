/**
 * `ui.*` — `components/ui/*` bileşenlerinin KENDİ sabit metinleri.
 *
 * Kural: prop ile dışarıdan verilen metinler (etiket, başlık, açıklama, çip adı)
 * buraya girmez; yalnız bileşenin kendi ürettiği varsayılan/erişilebilirlik
 * metinleri girer. Bileşenler bu yaprakları `useI18n()` ile basar, böylece
 * sayfa kodunda `aria-label`/varsayılan metin tekrarı kalmaz.
 *
 * `badge.*` yaprakları `components/ui/Badge.tsx` içindeki durum haritalarının
 * `labelKey` değerleridir; harita saf kalır (string→ton) ve etiketi basan taraf
 * (StatusBadge / sayfa) `t()` uygular.
 *
 * `en: typeof tr` iki dilde aynı anahtar ağacını derleme zamanında zorlar.
 */
export const tr = {
  pagination: {
    pageSize: 'Sayfa başına kayıt',
    previous: 'Önceki sayfa',
    next: 'Sonraki sayfa',
    range: '{from}–{to} / {total}',
    total: '{count} kayıt',
    pageOf: 'Sayfa {page} / {totalPages}',
  },
  filterBar: {
    label: 'Filtre çubuğu',
  },
  filterChips: {
    activeFilters: 'Etkin filtreler',
    remove: '{label} filtresini kaldır',
    count: '{count} filtre etkin',
  },
  badge: {
    salon: {
      approved: 'Onaylı',
      pending: 'Bekliyor',
      passive: 'Pasif',
    },
    appointment: {
      PENDING: 'Bekliyor',
      CONFIRMED: 'Onaylandı',
      COMPLETED: 'Tamamlandı',
      CANCELLED: 'İptal Edildi',
      NO_SHOW: 'Gelmedi',
    },
    role: {
      ADMIN: 'Admin',
      SALON_OWNER: 'Salon Sahibi',
      CUSTOMER: 'Müşteri',
    },
  },
  dialog: {
    close: 'Kapat',
  },
  dataTable: {
    emptyTitle: 'Kayıt yok',
  },
  states: {
    loading: 'Yükleniyor…',
    errorTitle: 'Veri alınamadı',
    retry: 'Yeniden dene',
  },
};

export const en: typeof tr = {
  pagination: {
    pageSize: 'Rows per page',
    previous: 'Previous page',
    next: 'Next page',
    range: '{from}–{to} / {total}',
    total: '{count} records',
    pageOf: 'Page {page} / {totalPages}',
  },
  filterBar: {
    label: 'Filter bar',
  },
  filterChips: {
    activeFilters: 'Active filters',
    remove: 'Remove {label} filter',
    count: '{count} filters active',
  },
  badge: {
    salon: {
      approved: 'Approved',
      pending: 'Pending',
      passive: 'Inactive',
    },
    appointment: {
      PENDING: 'Pending',
      CONFIRMED: 'Confirmed',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      NO_SHOW: 'No-show',
    },
    role: {
      ADMIN: 'Admin',
      SALON_OWNER: 'Salon Owner',
      CUSTOMER: 'Customer',
    },
  },
  dialog: {
    close: 'Close',
  },
  dataTable: {
    emptyTitle: 'No records',
  },
  states: {
    loading: 'Loading…',
    errorTitle: 'Could not load data',
    retry: 'Try again',
  },
};
