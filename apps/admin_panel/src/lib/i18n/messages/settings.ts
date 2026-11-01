/**
 * `settings.*` — Ayarlar sayfasının (`src/app/settings/page.tsx`) bölüm ve alan etiketleri.
 *
 * `tr` metinleri bugünkü sayfa kopyasından birebir alınmıştır (ör. "Genel Ayarlar",
 * "Token süresi (dakika)"); sayfa kopyası değişirse önce burası güncellenir.
 */
export const tr = {
  title: 'Ayarlar',
  subtitle: 'Platform, güvenlik ve bildirim tercihleri',
  save: 'Kaydet',
  saveAll: 'Ayarları kaydet',
  saving: 'Kaydediliyor…',
  saved: 'Ayarlar başarıyla kaydedildi.',
  saveFailed: 'Ayarlar kaydedilirken bir hata oluştu.',
  loadFailed: 'Ayarlar yüklenemedi',
  sections: {
    appearance: 'Görünüm',
    appearanceDescription:
      'Tema tercihi bu tarayıcıda saklanır; sunucu ayarlarına kaydedilmez.',
    appearanceHint: 'Light / Dark / Sistem — üst barda da erişilebilir.',
    language: 'Dil',
    languageDescription:
      'Dil tercihi bu tarayıcıda saklanır ve sunucu ayarlarına da yazılır.',
    general: 'Genel Ayarlar',
    security: 'Güvenlik Ayarları',
    notifications: 'Bildirim Ayarları',
    maintenance: 'Bakım Modu',
    maintenanceDescription:
      'Açıkken müşteri ve salon uygulamaları bakım sayfası görür.',
  },
  fields: {
    platformName: 'Platform adı',
    contactEmail: 'İletişim e-postası',
    contactEmailPlaceholder: 'destek@beautysalon.com',
    supportPhone: 'Destek telefonu',
    supportPhonePlaceholder: '+90 212 000 00 00',
    language: 'Dil',
    languageSystem: 'Sistem dili',
    languageTr: 'Türkçe',
    languageEn: 'English',
    maxLoginAttempts: 'Maksimum giriş denemesi',
    tokenDuration: 'Token süresi (dakika)',
    tokenDurationOption: '{value} dakika',
    // Çoğul (AP-011 K4): `count` yalnız varyantı seçer, sayıyı `{value}` basar
    // (taban anahtarın yer tutucusu geriye dönük uyum için korunur).
    tokenDurationOption_one: '{value} dakika',
    tokenDurationOption_other: '{value} dakika',
    rateLimiting: 'Rate limiting',
    rateLimitingDescription: 'Aşırı isteklerde bulunan istemcileri sınırla.',
    emailNotifications: 'E-posta bildirimleri',
    emailNotificationsDescription: 'Panel bildirimleri e-posta ile gönderilsin.',
    newSalonNotifications: 'Yeni salon başvurusu',
    newReviewNotifications: 'Yeni yorum',
  },
  maintenance: {
    active: 'Bakım modu aktif',
    activeDescription: 'Yalnızca panel erişimi açık kalır.',
  },
};

export const en: typeof tr = {
  title: 'Settings',
  subtitle: 'Platform, security and notification preferences',
  save: 'Save',
  saveAll: 'Save settings',
  saving: 'Saving…',
  saved: 'Settings saved successfully.',
  saveFailed: 'An error occurred while saving settings.',
  loadFailed: 'Settings could not be loaded',
  sections: {
    appearance: 'Appearance',
    appearanceDescription:
      'The theme preference is stored in this browser; it is not saved to server settings.',
    appearanceHint: 'Light / Dark / System — also available in the top bar.',
    language: 'Language',
    languageDescription:
      'The language preference is stored in this browser and also written to server settings.',
    general: 'General Settings',
    security: 'Security Settings',
    notifications: 'Notification Settings',
    maintenance: 'Maintenance Mode',
    maintenanceDescription:
      'While on, the customer and salon apps show a maintenance page.',
  },
  fields: {
    platformName: 'Platform name',
    contactEmail: 'Contact email',
    contactEmailPlaceholder: 'support@beautysalon.com',
    supportPhone: 'Support phone',
    supportPhonePlaceholder: '+90 212 000 00 00',
    language: 'Language',
    languageSystem: 'System language',
    languageTr: 'Turkish',
    languageEn: 'English',
    maxLoginAttempts: 'Maximum login attempts',
    tokenDuration: 'Token lifetime (minutes)',
    tokenDurationOption: '{value} minutes',
    tokenDurationOption_one: '{value} minute',
    tokenDurationOption_other: '{value} minutes',
    rateLimiting: 'Rate limiting',
    rateLimitingDescription: 'Throttle clients that send too many requests.',
    emailNotifications: 'Email notifications',
    emailNotificationsDescription: 'Send panel notifications by email.',
    newSalonNotifications: 'New salon application',
    newReviewNotifications: 'New review',
  },
  maintenance: {
    active: 'Maintenance mode active',
    activeDescription: 'Only panel access stays open.',
  },
};
