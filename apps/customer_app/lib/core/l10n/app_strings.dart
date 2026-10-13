import 'package:flutter/material.dart';

/// Uygulama çevirileri. `S.of(context).keyName` ile kullanılır.
class S {
  final String lang;
  const S._(this.lang);

  static S of(BuildContext context) {
    final code = Localizations.localeOf(context).languageCode;
    return S._(code);
  }

  bool get isEn => lang == 'en';

  // ── Navigation ─────────────────────────────────────────────────────────────
  String get navHome        => isEn ? 'Home'         : 'Ana Sayfa';
  String get navDiscover    => isEn ? 'Discover'     : 'Keşfet';
  String get navAppointments=> isEn ? 'Appointments' : 'Randevular';
  String get navProfile     => isEn ? 'Profile'      : 'Profil';

  // ── Auth ───────────────────────────────────────────────────────────────────
  String get loginTitle       => isEn ? 'Welcome Back'       : 'Hoş Geldiniz';
  String get loginSubtitle    => isEn ? 'Sign in to your account' : 'Hesabınıza giriş yapın';
  String get emailLabel       => isEn ? 'E-Mail'             : 'E-Posta';
  String get passwordLabel    => isEn ? 'Password'           : 'Şifre';
  String get loginButton      => isEn ? 'Sign In'            : 'Giriş Yap';
  String get noAccount        => isEn ? "Don't have an account?" : 'Hesabınız yok mu?';
  String get registerLink     => isEn ? 'Sign Up'            : 'Kayıt Ol';
  String get registerTitle    => isEn ? 'Create Account'     : 'Hesap Oluştur';
  String get registerSubtitle => isEn ? 'Join us today'      : 'Bize katılın';
  String get fullNameLabel    => isEn ? 'Full Name'          : 'Ad Soyad';
  String get phoneLabel       => isEn ? 'Phone (optional)'   : 'Telefon (isteğe bağlı)';
  String get registerButton   => isEn ? 'Create Account'     : 'Kayıt Ol';
  String get haveAccount      => isEn ? 'Already have an account?' : 'Zaten hesabınız var mı?';
  String get loginLink        => isEn ? 'Sign In'            : 'Giriş Yap';

  // ── Home ───────────────────────────────────────────────────────────────────
  String get homeGreeting     => isEn ? 'Hello'              : 'Merhaba';
  String get homeSearchHint   => isEn ? 'Search salons...'   : 'Salon ara...';
  String get homeNearby       => isEn ? 'Nearby Salons'      : 'Yakınımdaki Salonlar';
  String get homeTopRated     => isEn ? 'Top Rated'          : 'En Beğenilenler';
  String get seeAll           => isEn ? 'See All'            : 'Tümünü Gör';

  // ── Categories ─────────────────────────────────────────────────────────────
  String get catAll           => isEn ? 'All'                : 'Tümü';
  String get catHair          => isEn ? 'Hair'               : 'Saç';
  String get catNail          => isEn ? 'Nail'               : 'Tırnak';
  String get catSkin          => isEn ? 'Skin Care'          : 'Cilt Bakımı';
  String get catMakeup        => isEn ? 'Makeup'             : 'Makyaj';
  String get catSpa           => isEn ? 'Spa'                : 'Spa';
  String get catEpilation     => isEn ? 'Epilation'          : 'Epilasyon';

  // ── Profile ────────────────────────────────────────────────────────────────
  String get profileEdit      => isEn ? 'Edit Profile'       : 'Profili Düzenle';
  String get profileAccount   => isEn ? 'Account'            : 'Hesap';
  String get profileFavorites => isEn ? 'Favorites'          : 'Favorilerim';
  String get profileSettings  => isEn ? 'Settings'           : 'Ayarlar';
  String get profileNotifications => isEn ? 'Notifications'  : 'Bildirimler';

  // ── Notifications ──────────────────────────────────────────────────────────
  String get notificationsTitle    => isEn ? 'Notifications'   : 'Bildirimler';
  String get notificationsEmpty    => isEn ? 'No notifications' : 'Henüz bildiriminiz yok';
  String get notificationsEmptySub => isEn ? 'Notifications will appear here' : 'Bildirimler burada görünecek';
  String get markAllRead           => isEn ? 'Mark all read'   : 'Tümünü okundu işaretle';
  String get filterAll             => isEn ? 'All'             : 'Tümü';
  String get filterUnread          => isEn ? 'Unread'          : 'Okunmamış';
  String get typeAppointment       => isEn ? 'Appointment'     : 'Randevu';
  String get typeReview            => isEn ? 'Review'          : 'Yorum';
  String get typeOrder             => isEn ? 'Order'           : 'Sipariş';
  String get typeSystem            => isEn ? 'System'          : 'Sistem';
  String get profileLanguage  => isEn ? 'Language'           : 'Dil';
  String get profileDarkMode  => isEn ? 'Dark Mode'          : 'Karanlık Mod';
  String get profileHelp      => isEn ? 'Help & Support'     : 'Yardım & Destek';
  String get profilePrivacy   => isEn ? 'Privacy Policy'     : 'Gizlilik Politikası';
  String get profileAbout     => isEn ? 'About'              : 'Hakkında';
  String get profileLogout    => isEn ? 'Sign Out'           : 'Çıkış Yap';
  String get profileMember    => isEn ? 'Member'             : 'Üye';
  String get profileAppHistory=> isEn ? 'Appointment History': 'Randevu Geçmişi';
  String get profileMyReviews => isEn ? 'My Reviews'         : 'Yorumlarım';
  String get statAppointments => isEn ? 'Appointments'       : 'Randevu';
  String get statFavorites    => isEn ? 'Favorites'          : 'Favori';
  String get statReviews      => isEn ? 'Reviews'            : 'Yorum';
  String get logoutTitle      => isEn ? 'Sign Out'           : 'Çıkış Yap';
  String get logoutContent    => isEn ? 'Are you sure you want to sign out?' : 'Hesabınızdan çıkış yapmak istediğinize emin misiniz?';
  String get logoutConfirm    => isEn ? 'Sign Out'           : 'Çıkış Yap';

  // ── Appointments ───────────────────────────────────────────────────────────
  String get appointmentsTitle    => isEn ? 'Appointments'   : 'Randevularım';
  String get appointmentsUpcoming => isEn ? 'Upcoming'       : 'Yaklaşan';
  String get appointmentsPast     => isEn ? 'Past'           : 'Geçmiş';
  String get appointmentsCancelled=> isEn ? 'Cancelled'      : 'İptal';
  String get appointmentsEmpty    => isEn ? 'No appointments yet' : 'Henüz randevunuz yok';
  String get appointmentsBook     => isEn ? 'Book Appointment': 'Randevu Al';

  // ── Home ───────────────────────────────────────────────────────────────────
  String get homeWelcome      => isEn ? 'Welcome 👋'         : 'Hoş Geldiniz 👋';
  String get homeDiscover     => isEn ? 'Discover Your Beauty': 'Güzelliğini Keşfet';
  String get homeSearchHintFull => isEn ? 'Search salon or service...' : 'Salon veya hizmet ara...';
  String get homeNearbySalons => isEn ? 'Nearby Salons'      : 'Yakınındaki Salonlar';
  String get homeTopReviewed  => isEn ? 'Top Reviewed'       : 'En Çok Değerlendirilen';
  String get homeSeeAll       => isEn ? 'See All'            : 'Tümünü Gör';
  String get homeSalonsNotLoaded => isEn ? 'Could not load salons' : 'Salonlar yüklenemedi';
  String get homeNoSalons     => isEn ? 'No salons found'    : 'Salon bulunamadı';

  // ── Home — Nearby / Location ───────────────────────────────────────────────
  String get locationDenied   => isEn ? 'Location access denied' : 'Konum izni reddedildi';
  String get locationDeniedBody => isEn
      ? 'Enable location to see nearby salons'
      : 'Yakındaki salonları görmek için konum izni verin';

  // ── Login/Register ─────────────────────────────────────────────────────────
  String get loginSubtitleBrand => isEn ? 'Enhance Your Beauty' : 'Güzelliğinize değer katın';
  String get emailHint        => isEn ? 'example@email.com'  : 'ornek@email.com';
  String get passwordHint     => isEn ? 'Enter your password': 'Şifrenizi giriniz';
  String get emailRequired    => isEn ? 'Email is required'  : 'E-posta adresi gereklidir';
  String get emailInvalid     => isEn ? 'Enter a valid email': 'Geçerli bir e-posta adresi giriniz';
  String get passwordRequired => isEn ? 'Password is required': 'Şifre gereklidir';
  String get passwordMinLength=> isEn ? 'Password must be at least 6 characters' : 'Şifre en az 6 karakter olmalıdır';
  String get sendCode          => isEn ? 'Send Code'               : 'Kod Gönder';
  String get resetPasswordTitle=> isEn ? 'Reset Password'          : 'Şifreyi Sıfırla';
  String get resetPasswordButton=> isEn ? 'Reset Password'         : 'Şifreyi Sıfırla';
  String get resetPasswordSuccess => isEn
      ? 'Password reset successfully. You can now sign in.'
      : 'Şifreniz başarıyla sıfırlandı. Yeni şifrenizle giriş yapabilirsiniz.';
  String get otpLabel          => isEn ? 'Verification Code'       : 'Doğrulama Kodu';
  String get otpInvalid        => isEn ? 'Enter the 6-digit code'  : '6 haneli kodu girin';
  String get codeSent          => isEn ? 'Code sent to your email' : 'Kod e-posta adresinize gönderildi';
  String get codeSentBody      => isEn
      ? 'We sent a 6-digit code to'
      : '6 haneli kodu gönderdik';
  String get loginFailed      => isEn ? 'Login failed'       : 'Giriş başarısız oldu';

  // ── Auth — Password Reset ──────────────────────────────────────────────────
  String get forgotPasswordTitle  => isEn ? 'Forgot Password'       : 'Şifremi Unuttum';
  String get forgotPasswordSubtitle => isEn
      ? 'Enter your email and we will send you a code'
      : 'E-posta adresinizi girin, size bir kod göndereceğiz';
  String get forgotPasswordLink   => isEn ? 'Forgot Password?'      : 'Şifremi Unuttum?';

  // ── Appointments detail strings ────────────────────────────────────────────
  String get appointmentsNoUpcoming  => isEn ? 'No upcoming appointments' : 'Yaklaşan randevunuz yok';
  String get appointmentsNoPast      => isEn ? 'No past appointments'     : 'Geçmiş randevunuz yok';
  String get appointmentsNoCancelled => isEn ? 'No cancelled appointments': 'İptal edilen randevunuz yok';
  String get appointmentsExplore     => isEn ? 'Explore Salons'           : 'Salon Keşfet';
  String get appointmentsLoadFailed  => isEn ? 'Could not load'           : 'Yüklenemedi';
  String get appointmentsCancelTitle => isEn ? 'Cancel Appointment'       : 'Randevuyu İptal Et';
  String get appointmentsCancelContent => isEn ? 'Are you sure you want to cancel your appointment at' : 'adlı salondaki randevunuzu iptal etmek istediğinize emin misiniz?';
  String get appointmentsCancelKeep  => isEn ? 'Keep'                    : 'Vazgeç';
  String get appointmentsCancelDo    => isEn ? 'Cancel It'               : 'İptal Et';
  String get appointmentsCancelled2  => isEn ? 'Appointment cancelled'    : 'Randevu iptal edildi';
  String get appointmentsRebook      => isEn ? 'Rebook'                  : 'Tekrarla';
  String get appointmentsReview      => isEn ? 'Write Review'            : 'Yorum Yaz';
  String get appointmentsCancelAction=> isEn ? 'Cancel'                  : 'İptal Et';
  String get statusConfirmed  => isEn ? 'Confirmed'   : 'Onaylandı';
  String get statusPending    => isEn ? 'Pending'     : 'Bekliyor';
  String get statusCompleted  => isEn ? 'Completed'   : 'Tamamlandı';
  String get statusCancelled  => isEn ? 'Cancelled'   : 'İptal';

  // ── Common ─────────────────────────────────────────────────────────────────
  String get cancel           => isEn ? 'Cancel'             : 'İptal';
  String get confirm          => isEn ? 'Confirm'            : 'Onayla';
  String get retry            => isEn ? 'Retry'              : 'Tekrar Dene';
  String get errorLoading     => isEn ? 'Something went wrong' : 'Bir şeyler ters gitti';
  String get noResults        => isEn ? 'No results'           : 'Sonuç bulunamadı';
  String get resendCode       => isEn ? 'Resend Code'        : 'Kodu Tekrar Gönder';
  String get save             => isEn ? 'Save'               : 'Kaydet';
  String get back             => isEn ? 'Back'               : 'Geri';
  String get next             => isEn ? 'Next'               : 'Devam Et';
  String get loading          => isEn ? 'Loading...'         : 'Yükleniyor...';
  String get error            => isEn ? 'Error'              : 'Hata';

  // ── Discover ───────────────────────────────────────────────────────────────
  String get discoverSearchHint    => isEn ? 'Search salon or service...' : 'Salon veya hizmet ara...';
  String get discoverSalonsFound   => isEn ? 'salons found'    : 'salon bulundu';
  String get discoverClearFilter   => isEn ? 'Clear Filter'    : 'Filtreyi Temizle';
  String get discoverFilter        => isEn ? 'Filter'          : 'Filtrele';
  String get discoverReset         => isEn ? 'Reset'           : 'Sıfırla';
  String get discoverMaxDistance   => isEn ? 'Max Distance'    : 'Maksimum Mesafe';
  String get discoverAllDistances  => isEn ? 'All'             : 'Tümü';
  String get discoverMinRating     => isEn ? 'Min Rating'      : 'Minimum Puan';
  String get discoverStarsAndUp    => isEn ? 'stars and up'    : 'yıldız ve üzeri';
  String get discoverPriceRange    => isEn ? 'Price Range'     : 'Fiyat Aralığı';
  String get discoverServices      => isEn ? 'Services'        : 'Hizmetler';
  String get discoverApply         => isEn ? 'Apply'           : 'Uygula';
  String get discoverFiltersCount  => isEn ? 'filter(s)'       : 'filtre';
  String get discoverNoResults     => isEn ? 'No results found': 'Sonuç bulunamadı';
  String get discoverNoResultsHint => isEn ? 'Try changing your search criteria' : 'Arama kriterlerini değiştirmeyi deneyin';
  String get discoverClearFilters  => isEn ? 'Clear Filters'   : 'Filtreleri Temizle';
  String get discoverSortDistance  => isEn ? 'By Distance'     : 'Mesafeye Göre';
  String get discoverSortRating    => isEn ? 'By Rating'       : 'Puana Göre';
  String get discoverSortPriceLow  => isEn ? 'Price (Low → High)' : 'Fiyat (Düşük → Yüksek)';
  String get discoverSortPriceHigh => isEn ? 'Price (High → Low)' : 'Fiyat (Yüksek → Düşük)';
  String get discoverSortLabelDist => isEn ? 'Distance'        : 'Mesafe';
  String get discoverSortLabelRating => isEn ? 'Rating'        : 'Puan';
  String get discoverSortLabelPriceLow  => isEn ? 'Price ↑'   : 'Fiyat ↑';
  String get discoverSortLabelPriceHigh => isEn ? 'Price ↓'   : 'Fiyat ↓';
  String get discoverSortNewest    => isEn ? 'Newest'        : 'Yeni Eklenenler';
  String get discoverVerifiedOnly  => isEn ? 'Verified only' : 'Yalnızca onaylı salonlar';
  String get discoverCategory      => isEn ? 'Category'      : 'Kategori';
  String get discoverLocationOff   => isEn
      ? 'Distance filter needs location access'
      : 'Mesafe filtresi konum izniyle çalışır';
  String get discoverReviews       => isEn ? 'reviews'         : 'yorum';
  String get newSalonBadge       => isEn ? 'New'           : 'Yeni';

  // ── Language picker ────────────────────────────────────────────────────────
  String get selectLanguage   => isEn ? 'Select Language'    : 'Dil Seçin';
  String get langTurkish      => isEn ? 'Turkish'            : 'Türkçe';
  String get langEnglish      => isEn ? 'English'            : 'İngilizce';
  String get currentLang      => isEn ? 'English'            : 'Türkçe';

  // ── Register ───────────────────────────────────────────────────────────────
  String get registerWelcome    => isEn ? 'Welcome to the beauty world' : 'Güzellik dünyasına hoş geldiniz';
  String get nameMinLength      => isEn ? 'Name must be at least 2 characters' : 'İsim en az 2 karakter olmalı';

  // ── Edit Profile ───────────────────────────────────────────────────────────
  String get editProfileSaved   => isEn ? 'Profile updated'           : 'Profil güncellendi';
  String get editProfileError   => isEn ? 'An error occurred'         : 'Bir hata oluştu';
  String get changeAvatar         => isEn ? 'Change avatar'              : 'Avatarı değiştir';
  String get avatarUploading      => isEn ? 'Uploading avatar…'          : 'Avatar yükleniyor…';
  String get nameRequired       => isEn ? 'Full name is required'     : 'Ad soyad boş olamaz';
  String get nameMin3           => isEn ? 'Enter at least 3 characters' : 'En az 3 karakter girin';
  String get emailRequiredField => isEn ? 'Email is required'         : 'E-posta boş olamaz';
  String get emailInvalidField  => isEn ? 'Enter a valid email'       : 'Geçerli bir e-posta girin';
  String get phoneRequired      => isEn ? 'Phone is required'         : 'Telefon boş olamaz';
  String get changePassword     => isEn ? 'Change Password'           : 'Şifreyi Değiştir';
  String get saveChanges        => isEn ? 'Save Changes'              : 'Değişiklikleri Kaydet';
  String get currentPassword    => isEn ? 'Current Password'          : 'Mevcut Şifre';
  String get currentPasswordRequired => isEn ? 'Enter your current password' : 'Mevcut şifrenizi girin';
  String get newPassword        => isEn ? 'New Password'              : 'Yeni Şifre';
  String get newPasswordRequired => isEn ? 'Enter new password'       : 'Yeni şifre girin';
  String get newPasswordConfirm => isEn ? 'New Password (Confirm)'    : 'Yeni Şifre (Tekrar)';
  String get passwordMismatch   => isEn ? 'Passwords do not match'    : 'Şifreler eşleşmiyor';
  String get updatePassword     => isEn ? 'Update Password'           : 'Şifreyi Güncelle';
  String get passwordChanged    => isEn ? 'Password changed'          : 'Şifre değiştirildi';
  String get emailSameAsCurrent     => isEn ? 'Same as current email'      : 'Mevcut e-posta ile aynı';
  String get emailChangeHint        => isEn
      ? 'Email changes require a verification code'
      : 'E-posta değişikliği doğrulama kodu ile yapılır';
  String get sendVerificationCode   => isEn ? 'Send Verification Code'     : 'Doğrulama Kodu Gönder';
  String get confirmEmailChangeBtn  => isEn ? 'Confirm Email Change'       : 'E-posta Değişikliğini Onayla';
  String get emailChangeSuccess     => isEn ? 'Email updated'              : 'E-posta başarıyla değiştirildi';

  // ── Write Review ───────────────────────────────────────────────────────────
  String get reviewRatePrompt   => isEn ? 'Rate your experience'      : 'Deneyiminizi puanlayın';
  String get reviewCommentLabel => isEn ? 'Your Comment'              : 'Yorumunuz';
  String get reviewCommentHint  => isEn ? 'Share your experience...'  : 'Deneyiminizi paylaşın...';
  String get reviewAddPhotos    => isEn ? 'Add Photos (Optional)'     : 'Fotoğraf Ekle (İsteğe bağlı)';
  String get reviewAddBtn       => isEn ? 'Add'                       : 'Ekle';
  String get reviewCamera       => isEn ? 'Camera'                  : 'Kamera';
  String get reviewGallery      => isEn ? 'Gallery'                 : 'Galeri';
  String get reviewMaxPhotos    => isEn ? 'You can add up to 4 photos' : 'En fazla 4 fotoğraf ekleyebilirsiniz';
  String get imageUploadError   => isEn ? 'Could not upload image'   : 'Fotoğraf yüklenemedi';
  String get reviewSubmit       => isEn ? 'Submit Review'             : 'Yorumu Gönder';
  String get reviewSubmitFailed => isEn ? 'Review could not be submitted' : 'Yorum gönderilemedi';
  String get reviewThanks       => isEn ? 'Thank You!'                : 'Teşekkürler!';
  String get reviewSuccess      => isEn ? 'Your review has been submitted.' : 'Yorumunuz başarıyla gönderildi.';
  String get ok                 => isEn ? 'OK'                        : 'Tamam';
  String get ratingBad          => isEn ? 'Bad'                       : 'Kötü';
  String get ratingOkay         => isEn ? 'Not Bad'                   : 'Fena Değil';
  String get ratingGood         => isEn ? 'Good'                      : 'İyi';
  String get ratingVeryGood     => isEn ? 'Very Good'                 : 'Çok İyi';
  String get ratingExcellent    => isEn ? 'Excellent!'                : 'Mükemmel!';
  String get ratingTap          => isEn ? 'Tap to rate'               : 'Dokunarak puanlayın';

  // ── Salon Detail ───────────────────────────────────────────────────────────
  String get salonLoadFailed    => isEn ? 'Could not load salon'      : 'Salon yüklenemedi';
  String get salonNew           => isEn ? 'New'                       : 'Yeni';
  String get salonToday         => isEn ? 'Today'                     : 'Bugün';
  String get salonCall          => isEn ? 'Call'                      : 'Ara';
  String get salonDirections    => isEn ? 'Directions'                : 'Yol Tarifi';
  String get salonShare         => isEn ? 'Share'                     : 'Paylaş';
  String get workingHours       => isEn ? 'Working Hours'              : 'Çalışma Saatleri';
  String get closed             => isEn ? 'Closed'                     : 'Kapalı';
  String get salonTabServices   => isEn ? 'Services'                  : 'Hizmetler';
  String get salonTabStaff      => isEn ? 'Staff'                     : 'Ekip';
  String get salonTabReviews    => isEn ? 'Reviews'                   : 'Yorumlar';

  // ── Favorites ──────────────────────────────────────────────────────────────
  String get favoritesEmpty     => isEn ? 'No favorites yet'          : 'Henüz favoriniz yok';
  String get favoritesEmptySub  => isEn ? 'Add salons you like to favorites' : 'Beğendiğiniz salonları favorilere ekleyin';
  String get favoritesExplore   => isEn ? 'Explore Salons'            : 'Salon Keşfet';
  String get favoritesRemoved   => isEn ? 'removed from favorites'    : 'favorilerden kaldırıldı';
  String get favoritesUndo      => isEn ? 'Undo'                      : 'Geri Al';
  String get reviews            => isEn ? 'reviews'                   : 'yorum';

  // ── Review List Widget ─────────────────────────────────────────────────────
  String get reviewsLoadFailed  => isEn ? 'Could not load reviews.'   : 'Yorumlar yüklenemedi.';
  String get reviewsEmpty       => isEn ? 'No reviews yet.'           : 'Henüz yorum yapılmamış.';
  String get loadMore           => isEn ? 'Load more'                 : 'Daha fazla yükle';
  String get reviewsSalonReply  => isEn ? 'Salon Reply'               : 'Salon Yanıtı';

  // ── Service List Widget ────────────────────────────────────────────────────
  String get servicesEmpty      => isEn ? 'No services found.'        : 'Hizmet bulunamadı.';
  String get serviceOther       => isEn ? 'Other'                     : 'Diğer';
  String get serviceDurationMin => isEn ? 'min'                       : 'dk';

  // ── Staff List Widget ──────────────────────────────────────────────────────
  String get staffEmpty         => isEn ? 'No staff information found.' : 'Ekip bilgisi bulunamadı.';

  // ── Booking ────────────────────────────────────────────────────────────────
  String get bookingTitle       => isEn ? 'Book Appointment'          : 'Randevu Al';
  String get bookingStepService => isEn ? 'Service'                   : 'Hizmet';
  String get bookingStepStaff   => isEn ? 'Staff'                     : 'Çalışan';
  String get bookingStepDateTime => isEn ? 'Date/Time'                : 'Tarih/Saat';
  String get bookingStepConfirm => isEn ? 'Confirm'                   : 'Onay';
  String get bookingNoServices  => isEn ? 'No services found for this salon.' : 'Bu salon için hizmet bulunamadı.';
  String get bookingAnyStaff    => isEn ? 'Any Staff'                 : 'Fark Etmez';
  String get bookingAnyStaffSub => isEn ? 'Available staff will be assigned automatically' : 'Uygun çalışan otomatik atanır';
  String get bookingSelectDate  => isEn ? 'Select Date'               : 'Tarih Seçin';
  String get bookingSelectTime  => isEn ? 'Select Time'               : 'Saat Seçin';
  String get bookingLoadTimes   => isEn ? 'Load Times'                : 'Saatleri Yükle';
  String get bookingSelectDateFirst => isEn ? 'Available times will load after selecting a date.' : 'Tarih seçildikten sonra müsait saatler yüklenecek.';
  String get bookingConfirmService => isEn ? 'Service'                : 'Hizmet';
  String get bookingConfirmFee  => isEn ? 'Fee'                       : 'Ücret';
  String get bookingConfirmDuration => isEn ? 'Duration'              : 'Süre';
  String get bookingConfirmStaff => isEn ? 'Staff'                    : 'Çalışan';
  String get bookingConfirmDate => isEn ? 'Date'                      : 'Tarih';
  String get bookingConfirmTime => isEn ? 'Time'                      : 'Saat';
  String get bookingNoteHint    => isEn ? 'Add a note (optional)...'  : 'Not ekleyin (isteğe bağlı)...';
  String get bookingConfirmButton => isEn ? 'Confirm Appointment'     : 'Randevuyu Onayla';
  String get bookingSuccessTitle => isEn ? 'Appointment Created!'     : 'Randevunuz Oluşturuldu!';
  String get bookingSuccessBody => isEn ? 'You will be notified after salon approval.' : 'Salon onayından sonra bilgilendirileceksiniz.';
  String get bookingGoToAppointments => isEn ? 'Go to My Appointments' : 'Randevularıma Git';
  String get bookingBackHome    => isEn ? 'Back to Home'              : 'Ana Sayfaya Dön';

  // ── Day abbreviations ──────────────────────────────────────────────────────
  List<String> dayAbbrs(BuildContext ctx) => isEn
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  // ── Full day names ─────────────────────────────────────────────────────────
  List<String> dayNames(BuildContext ctx) => isEn
      ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      : ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

  // ── Month names ────────────────────────────────────────────────────────────
  List<String> monthNames(BuildContext ctx) => isEn
      ? ['January', 'February', 'March', 'April', 'May', 'June',
         'July', 'August', 'September', 'October', 'November', 'December']
      : ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
         'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

  // ── Home (error states) ────────────────────────────────────────────────────
  String get homeLoadFailed     => isEn ? 'Could not load salons'     : 'Salonlar yüklenemedi';
}
