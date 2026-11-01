/**
 * `reviews.*` — Yorum Yönetimi sayfası ve yoruma özgü bileşenler
 * (`components/reviews/ReviewActions`, `ReviewDetailDialog`, `Stars`).
 *
 * Kapsam bilinçli olarak dar: yalnız yoruma özgü metinler. Ortak bileşenlerin
 * (Pagination, FilterChips, Dialog) genel etiketleri burada DEĞİL, kendi
 * namespace'lerinde (`ui.*`, `common.*`) çevrilidir.
 *
 * `tr` metinleri bugünkü sayfa kopyasından birebir alınmıştır; sayfa kopyası
 * değişirse önce burası güncellenir. Yer tutucular `{count}`, `{label}`,
 * `{rating}`, `{name}`, `{query}`, `{customer}`, `{index}`, `{max}` süslü
 * parantezle yazılır (bkz. `translate`).
 *
 * Çip ve seçenek metinleri iki parçalıdır: şablon anahtarı (`chips.visibility`
 * gibi) + değer anahtarı (`visibility.visible` gibi). Saf modül
 * (`lib/reviewsQuery.ts`) metin değil anahtar döndürür, sayfa `t(...)` ile basar.
 */
export const tr = {
  page: {
    title: 'Yorum Yönetimi',
    subtitle: '{count} yorum',
    // Çoğul (AP-011 K4): TR'de tekil/çoğul aynı metin — iki varyant bilinçli olarak eşit.
    subtitle_one: '{count} yorum',
    subtitle_other: '{count} yorum',
    refresh: 'Yenile',
    searchPlaceholder: 'Müşteri, salon veya yorum metni ara…',
    searchAriaLabel: 'Yorum ara',
    visibilityFilter: 'Görünüm',
    ratingFilter: 'Puan',
    replyFilter: 'Yanıt',
    salonFilter: 'Salon',
    dateFilter: 'Tarih',
    allSalons: 'Tüm salonlar',
    allRatings: 'Tüm puanlar',
  },
  /** Görünürlük adları: hem filtre/cip hem kart ve detay rozeti. */
  visibility: {
    all: 'Tümü',
    visible: 'Görünür',
    hidden: 'Gizli',
  },
  /** Yanıt durumu adları (filtre + cip). */
  reply: {
    all: 'Tümü',
    replied: 'Yanıtlı',
    unreplied: 'Yanıtsız',
  },
  rating: {
    stars: '{rating} yıldız',
  },
  /** Select seçeneği: etiket + filtresiz global sayaç. */
  option: '{label} ({count})',
  sort: {
    newest: 'En yeni',
    highestRating: 'En yüksek puan',
    lowestRating: 'En düşük puan',
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
    visibility: 'Görünüm: {label}',
    rating: 'Puan: {rating} yıldız',
    reply: 'Yanıt: {label}',
    salon: 'Salon: {name}',
    date: 'Tarih: {label}',
    search: 'Arama: "{query}"',
  },
  card: {
    guest: 'Misafir',
    noComment: 'Yorum yazılmamış.',
    salonReply: 'Salon yanıtı',
  },
  actions: {
    detail: 'Detay',
    reply: 'Yanıtla',
    editReply: 'Yanıtı düzenle',
    hide: 'Gizle',
    makeVisible: 'Görünür yap',
    delete: 'Sil',
  },
  detail: {
    title: 'Yorum detayı',
    close: 'Kapat',
    customer: 'Müşteri',
    salon: 'Salon',
    rating: 'Puan',
    createdAt: 'Yorum tarihi',
    visibility: 'Görünürlük',
    imageAlt: '{customer} yorum görseli {index}',
  },
  replyDialog: {
    title: 'Yorumu yanıtla',
    back: 'Vazgeç',
    label: 'Yanıt',
    hint: '{count}/{max} karakter',
    placeholder: 'Yoruma verilecek yanıtı yazın…',
    errorLength: 'Yanıt 1-2000 karakter arasında olmalıdır',
    save: 'Kaydet',
  },
  deleteDialog: {
    title: 'Yorumu sil',
    back: 'Vazgeç',
    message: 'Yorum kalıcı olarak silinecek. Bu işlem geri alınamaz.',
    confirm: 'Sil',
  },
  empty: {
    filteredTitle: 'Eşleşme yok',
    filteredDescription: 'Filtreleri temizleyip tekrar deneyin.',
    noneTitle: 'Yorum bulunamadı',
    noneDescription: 'Henüz yorum bulunmuyor.',
  },
  notice: {
    loadError: 'Yorumlar yüklenemedi',
    replySaved: 'Yanıt kaydedildi',
    replySaveError: 'Yanıt kaydedilemedi',
    madeVisible: 'Yorum görünür yapıldı',
    hidden: 'Yorum gizlendi',
    visibilityError: 'Görünürlük güncellenemedi',
    deleted: 'Yorum silindi',
    deleteError: 'Yorum silinemedi',
  },
};

export const en: typeof tr = {
  page: {
    title: 'Review Management',
    subtitle: '{count} reviews',
    subtitle_one: '{count} review',
    subtitle_other: '{count} reviews',
    refresh: 'Refresh',
    searchPlaceholder: 'Search by customer, salon or review text…',
    searchAriaLabel: 'Search reviews',
    visibilityFilter: 'Visibility',
    ratingFilter: 'Rating',
    replyFilter: 'Reply',
    salonFilter: 'Salon',
    dateFilter: 'Date',
    allSalons: 'All salons',
    allRatings: 'All ratings',
  },
  visibility: {
    all: 'All',
    visible: 'Visible',
    hidden: 'Hidden',
  },
  reply: {
    all: 'All',
    replied: 'Replied',
    unreplied: 'Unreplied',
  },
  rating: {
    stars: '{rating} stars',
  },
  option: '{label} ({count})',
  sort: {
    newest: 'Newest',
    highestRating: 'Highest rating',
    lowestRating: 'Lowest rating',
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
    visibility: 'Visibility: {label}',
    rating: 'Rating: {rating} stars',
    reply: 'Reply: {label}',
    salon: 'Salon: {name}',
    date: 'Date: {label}',
    search: 'Search: "{query}"',
  },
  card: {
    guest: 'Guest',
    noComment: 'No comment was written.',
    salonReply: 'Salon reply',
  },
  actions: {
    detail: 'Details',
    reply: 'Reply',
    editReply: 'Edit reply',
    hide: 'Hide',
    makeVisible: 'Make visible',
    delete: 'Delete',
  },
  detail: {
    title: 'Review details',
    close: 'Close',
    customer: 'Customer',
    salon: 'Salon',
    rating: 'Rating',
    createdAt: 'Review date',
    visibility: 'Visibility',
    imageAlt: '{customer} review image {index}',
  },
  replyDialog: {
    title: 'Reply to review',
    back: 'Back',
    label: 'Reply',
    hint: '{count}/{max} characters',
    placeholder: 'Write the reply to this review…',
    errorLength: 'The reply must be between 1 and 2000 characters',
    save: 'Save',
  },
  deleteDialog: {
    title: 'Delete review',
    back: 'Back',
    message: 'The review will be permanently deleted. This action cannot be undone.',
    confirm: 'Delete',
  },
  empty: {
    filteredTitle: 'No matches',
    filteredDescription: 'Clear the filters and try again.',
    noneTitle: 'No reviews found',
    noneDescription: 'There are no reviews yet.',
  },
  notice: {
    loadError: 'Reviews could not be loaded',
    replySaved: 'Reply saved',
    replySaveError: 'The reply could not be saved',
    madeVisible: 'Review is now visible',
    hidden: 'Review hidden',
    visibilityError: 'Visibility could not be updated',
    deleted: 'Review deleted',
    deleteError: 'The review could not be deleted',
  },
};
