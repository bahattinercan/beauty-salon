/**
 * `common.*` — ekranlar arası ortak eylem ve durum metinleri.
 *
 * Kural: `tr` bugünkü arayüz kopyasının BİREBİR aynısıdır; `en` doğal İngilizcedir.
 * `en: typeof tr` iki dilde aynı anahtar ağacını derleme zamanında zorlar.
 */
export const tr = {
  save: 'Kaydet',
  saving: 'Kaydediliyor…',
  cancel: 'İptal',
  loading: 'Yükleniyor',
  error: 'Hata',
  retry: 'Tekrar dene',
  search: 'Ara',
  clear: 'Temizle',
  all: 'Tümü',
};

export const en: typeof tr = {
  save: 'Save',
  saving: 'Saving…',
  cancel: 'Cancel',
  loading: 'Loading',
  error: 'Error',
  retry: 'Try again',
  search: 'Search',
  clear: 'Clear',
  all: 'All',
};
