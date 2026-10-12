import 'package:flutter/material.dart';

/// Salon app çevirileri. `S.of(context).keyName` ile kullanılır.
class S {
  final String lang;
  const S._(this.lang);

  static S of(BuildContext context) {
    final code = Localizations.localeOf(context).languageCode;
    return S._(code);
  }

  bool get isEn => lang == 'en';

  // ── Navigation ─────────────────────────────────────────────────────────────
  String get navDashboard   => isEn ? 'Dashboard'    : 'Panel';
  String get navAppointments=> isEn ? 'Appointments' : 'Randevular';
  String get navTeam        => isEn ? 'Team'         : 'Ekip';
  String get navReviews     => isEn ? 'Reviews'      : 'Yorumlar';
  String get navMySalon     => isEn ? 'My Salon'     : 'Salonum';

  // ── Auth ───────────────────────────────────────────────────────────────────
  String get appTitle         => isEn ? 'Salon Management'                    : 'Salon Yönetimi';
  String get loginSubtitle    => isEn ? 'Sign in to manage your salon'        : 'Salonunuzu yönetmek için giriş yapın';
  String get emailLabel       => isEn ? 'E-Mail'                              : 'E-posta';
  String get passwordLabel    => isEn ? 'Password'                            : 'Şifre';
  String get emailRequired    => isEn ? 'Email is required'                   : 'E-posta gerekli';
  String get emailInvalid     => isEn ? 'Enter a valid email'                 : 'Geçerli bir e-posta girin';
  String get passwordRequired => isEn ? 'Password is required'                : 'Şifre gerekli';
  String get passwordMinLength=> isEn ? 'Password must be at least 6 chars'   : 'Şifre en az 6 karakter olmalı';
  String get loginButton          => isEn ? 'Sign In'                              : 'Giriş Yap';
  String get ownerOnly            => isEn ? 'This app is for salon owners only.'   : 'Bu uygulama yalnızca salon sahiplerine özeldir.';
  String get forgotPassword       => isEn ? 'Forgot Password?'                     : 'Şifremi Unuttum';
  String get forgotPasswordTitle  => isEn ? 'Reset Password'                       : 'Şifremi Sıfırla';
  String get forgotPasswordBody   => isEn ? 'Enter your email address to receive a reset code.' : 'Sıfırlama kodu göndermek için e-posta adresinizi girin.';
  String get sendCode             => isEn ? 'Send Code'                            : 'Kod Gönder';
  String get resetPasswordTitle   => isEn ? 'Enter Reset Code'                     : 'Kodu Girin';
  String resetPasswordBody(String email) => isEn
      ? 'A 6-digit code has been sent to $email. Enter it along with your new password.'
      : '$email adresine 6 haneli kod gönderildi. Kodu ve yeni şifrenizi girin.';
  String get resetCode            => isEn ? 'Reset Code'                           : 'Doğrulama Kodu';
  String get passwordResetSuccess => isEn ? 'Password reset successfully'          : 'Şifre başarıyla sıfırlandı';

  // ── Common ─────────────────────────────────────────────────────────────────
  String get save             => isEn ? 'Save'       : 'Kaydet';
  String get cancel           => isEn ? 'Cancel'     : 'İptal';
  String get delete           => isEn ? 'Delete'     : 'Sil';
  String get edit             => isEn ? 'Edit'       : 'Düzenle';
  String get all              => isEn ? 'All'        : 'Tümü';
  String get confirm          => isEn ? 'Confirm'    : 'Onayla';
  String get close            => isEn ? 'Close'      : 'Kapat';
  String get yes              => isEn ? 'Yes'        : 'Evet';
  String get no               => isEn ? 'No'         : 'Hayır';
  String get error            => isEn ? 'Error'      : 'Hata';
  String get active           => isEn ? 'Active'     : 'Aktif';
  String get inactive         => isEn ? 'Inactive'   : 'Pasif';
  String get setInactive      => isEn ? 'Set Inactive': 'Pasif Yap';
  String get setActive        => isEn ? 'Set Active' : 'Aktif Yap';
  String get phone            => isEn ? 'Phone'      : 'Telefon';
  String get emailFieldLabel  => isEn ? 'E-Mail'     : 'E-posta';
  String get description      => isEn ? 'Description': 'Açıklama';
  String errorMsg(String msg) => '${isEn ? 'Error' : 'Hata'}: $msg';

  // ── Status ─────────────────────────────────────────────────────────────────
  String get statusConfirmed  => isEn ? 'Confirmed'  : 'Onaylı';
  String get statusPending    => isEn ? 'Pending'    : 'Bekliyor';
  String get statusCompleted  => isEn ? 'Completed'  : 'Tamamlandı';
  String get statusCancelled  => isEn ? 'Cancelled'  : 'İptal';
  String get statusNoShow     => isEn ? 'No Show'    : 'Gelmedi';
  String statusLabel(String s) {
    switch (s) {
      case 'CONFIRMED': return statusConfirmed;
      case 'PENDING': return statusPending;
      case 'COMPLETED': return statusCompleted;
      case 'CANCELLED': return statusCancelled;
      case 'NO_SHOW': return statusNoShow;
      default: return s;
    }
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  String get helloOwner       => isEn ? 'Hello, Salon Owner'   : 'Merhaba, Salon Sahibi';
  String get today            => isEn ? 'Today'                : 'Bugün';
  String get thisWeek         => isEn ? 'This Week'            : 'Bu Hafta';
  String get average          => isEn ? 'Average'              : 'Ortalama';
  String get rating           => isEn ? 'Rating'               : 'Puan';
  String get totalReviews     => isEn ? 'Reviews'              : 'Yorum';
  String get total            => isEn ? 'Total'                : 'Toplam';
  String get weeklyChart      => isEn ? 'Weekly Appointments'  : 'Haftalık Randevu';
  String get todayAppointments=> isEn ? "Today's Appointments" : 'Bugünkü Randevular';
  String get noAppointmentsToday => isEn ? 'No appointments today' : 'Bugün randevu yok';
  String get appointment      => isEn ? 'Appointment'          : 'Randevu';
  List<String> get dayAbbreviations => isEn
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  // ── Appointments ───────────────────────────────────────────────────────────
  String get appointmentsTitle       => isEn ? 'Appointments'               : 'Randevular';
  String appointmentCount(int n)     => isEn ? '$n appointment${n==1?'':'s'}' : '$n randevu';
  String get filterPending           => isEn ? 'Pending'                    : 'Bekleyen';
  String get filterConfirmed         => isEn ? 'Confirmed'                  : 'Onaylı';
  String get noAppointmentsForDate   => isEn ? 'No appointments for this date' : 'Bu tarihte randevu bulunamadı';
  String get appointmentConfirmed    => isEn ? 'Appointment confirmed'      : 'Randevu onaylandı';
  String get appointmentCompleted    => isEn ? 'Appointment completed'      : 'Randevu tamamlandı';
  String get appointmentCancelled    => isEn ? 'Appointment cancelled'      : 'Randevu iptal edildi';
  String get cancelAppointmentTitle  => isEn ? 'Cancel Appointment'         : 'Randevuyu İptal Et';
  String cancelAppointmentBody(String name) =>
      isEn ? 'Cancel $name\'s appointment? This cannot be undone.'
           : '$name randevusunu iptal etmek istediğinize emin misiniz?';
  String get cancelAction            => isEn ? 'Cancel It'                  : 'İptal Et';
  String get dismiss                 => isEn ? 'Dismiss'                    : 'Vazgeç';
  String get complete                => isEn ? 'Complete'                   : 'Tamamla';

  // ── Staff ──────────────────────────────────────────────────────────────────
  String get teamManagement     => isEn ? 'Team Management'          : 'Ekip Yönetimi';
  String get noStaffYet         => isEn ? 'No staff members yet'     : 'Henüz çalışan eklenmemiş';
  String get servicesLabel      => isEn ? 'Services'                 : 'Hizmetler';
  String get addStaff           => isEn ? 'Add Staff'                : 'Çalışan Ekle';
  String get editStaffTitle     => isEn ? 'Edit Staff'               : 'Çalışanı Düzenle';
  String get deleteStaffTitle   => isEn ? 'Delete Staff'             : 'Çalışanı Sil';
  String deleteStaffBody(String name) =>
      isEn ? '$name will be permanently deleted. Are you sure?'
           : '$name silinecek. Emin misiniz?';
  String get fullName           => isEn ? 'Full Name'                : 'Ad Soyad';
  String get fullNameRequired   => isEn ? 'Full name is required'    : 'Ad soyad gerekli';
  String get title              => isEn ? 'Title'                    : 'Ünvan';

  // ── Services ───────────────────────────────────────────────────────────────
  String get serviceManagement  => isEn ? 'Service Management'       : 'Hizmet Yönetimi';
  String get noServicesYet      => isEn ? 'No services yet'          : 'Henüz hizmet eklenmemiş';
  String get addService         => isEn ? 'Add Service'              : 'Hizmet Ekle';
  String get editServiceTitle   => isEn ? 'Edit Service'             : 'Hizmeti Düzenle';
  String get deleteServiceTitle => isEn ? 'Delete Service'           : 'Hizmeti Sil';
  String deleteServiceBody(String name) =>
      isEn ? '"$name" will be permanently deleted. Are you sure?'
           : '"$name" silinecek. Emin misiniz?';
  String get otherCategory      => isEn ? 'Other'                    : 'Diğer';
  String get serviceName        => isEn ? 'Service Name'             : 'Hizmet Adı';
  String get category           => isEn ? 'Category'                 : 'Kategori';
  String get durationMin        => isEn ? 'Duration (min)'           : 'Süre (dk)';
  String get priceLabel         => isEn ? 'Price (₺)'                : 'Fiyat (₺)';
  String get descriptionOptional=> isEn ? 'Description (optional)'   : 'Açıklama (opsiyonel)';
  String get minAbbr            => isEn ? 'min'                      : 'dk';

  // ── Reviews ────────────────────────────────────────────────────────────────
  String get reviewsTitle       => isEn ? 'Reviews'                  : 'Yorumlar';
  String get reviewsAvg         => isEn ? 'Average'                  : 'Ortalama';
  String get reviewsTotal       => isEn ? 'Total'                    : 'Toplam';
  String get reviewsUnanswered  => isEn ? 'Unanswered'               : 'Yanıtsız';
  String get reviewsAnswered    => isEn ? 'Answered'                 : 'Yanıtlı';
  String get noReviewsFound     => isEn ? 'No reviews found'         : 'Yorum bulunamadı';
  String get loadMore          => isEn ? 'Load more'                : 'Daha fazla göster';
  String get photos            => isEn ? 'Photos'                   : 'Fotoğraflar';
  String get addPhotos         => isEn ? 'Add photos'               : 'Fotoğraf ekle';
  String get noPhotos          => isEn ? 'No photos yet'            : 'Henüz fotoğraf yok';
  String get photosAdded       => isEn ? 'Photos added'             : 'Fotoğraflar eklendi';
  String replyDialogTitle(String name) =>
      isEn ? 'Reply to $name' : '$name için yanıt';
  String get replyHint          => isEn ? 'Write your reply...'      : 'Yanıtınızı yazın...';
  String get send               => isEn ? 'Send'                     : 'Gönder';
  String get replySent          => isEn ? 'Reply sent'               : 'Yanıt gönderildi';
  String get editReply          => isEn ? 'Edit Reply'               : 'Yanıtı Düzenle';
  String get reply              => isEn ? 'Reply'                    : 'Yanıtla';

  // ── Profile ────────────────────────────────────────────────────────────────
  String get verified           => isEn ? 'Verified'                 : 'Onaylı';
  String get staffCount         => isEn ? 'Staff'                    : 'Çalışan';
  String get serviceCount       => isEn ? 'Services'                 : 'Hizmet';
  String get reviewCount        => isEn ? 'Reviews'                  : 'Yorum';
  String get salonInfo          => isEn ? 'Salon Info'               : 'Salon Bilgileri';
  String get salonName          => isEn ? 'Salon Name'               : 'Salon Adı';
  String get editSalonInfo      => isEn ? 'Edit Salon Info'          : 'Salon Bilgilerini Düzenle';
  // E-posta & Telefon değişikliği
  String get changeEmail              => isEn ? 'Change Email'                       : 'E-postayı Değiştir';
  String get changePhone              => isEn ? 'Change Phone'                       : 'Telefonu Değiştir';
  String get newPhone                 => isEn ? 'New Phone Number'                   : 'Yeni Telefon Numarası';
  String get verifyViaTitle           => isEn ? 'Verification Method'                : 'Doğrulama Yöntemi';
  String get verifyViaEmail           => isEn ? 'Send code to email'                 : 'E-postaya kod gönder';
  String get verifyViaSms             => isEn ? 'Send SMS to phone'                  : 'Telefona SMS gönder';
  String get emailChangeOtpTitle      => isEn ? 'Email Change Verification'          : 'E-posta Değişikliği Doğrulama';
  String get phoneChangeOtpTitle      => isEn ? 'Phone Change Verification'          : 'Telefon Değişikliği Doğrulama';
  String otpSentToEmail(String email) => isEn
      ? 'A 6-digit code has been sent to $email.'
      : '$email adresine 6 haneli kod gönderildi.';
  String otpSentToPhone(String phone) => isEn
      ? 'A 6-digit code has been sent via SMS to $phone.'
      : '$phone numarasına SMS ile 6 haneli kod gönderildi.';
  String get emailChanged             => isEn ? 'Email updated successfully'         : 'E-posta başarıyla güncellendi';
  String get phoneChanged             => isEn ? 'Phone updated successfully'         : 'Telefon numarası başarıyla güncellendi';
  String get address            => isEn ? 'Address'                  : 'Adres';
  String get workingHours       => isEn ? 'Working Hours'            : 'Çalışma Saatleri';
  String get editWorkingHours   => isEn ? 'Edit Working Hours'       : 'Çalışma Saatlerini Düzenle';
  String get monFri             => isEn ? 'Mon - Fri'                : 'Pazartesi - Cuma';
  String get monday             => isEn ? 'Monday'                   : 'Pazartesi';
  String get tuesday            => isEn ? 'Tuesday'                  : 'Salı';
  String get wednesday          => isEn ? 'Wednesday'                : 'Çarşamba';
  String get thursday           => isEn ? 'Thursday'                 : 'Perşembe';
  String get friday             => isEn ? 'Friday'                   : 'Cuma';
  String get saturday           => isEn ? 'Saturday'                 : 'Cumartesi';
  String get sunday             => isEn ? 'Sunday'                   : 'Pazar';
  String get closed             => isEn ? 'Closed'                   : 'Kapalı';
  String get openTime           => isEn ? 'Open'                     : 'Açılış';
  String get closeTime          => isEn ? 'Close'                    : 'Kapanış';
  String get settings           => isEn ? 'Settings'                 : 'Ayarlar';
  String get notificationSettings => isEn ? 'Notifications'          : 'Bildirim Ayarları';
  String get changePassword           => isEn ? 'Change Password'                    : 'Şifre Değiştir';
  String get currentPassword          => isEn ? 'Current Password'                   : 'Mevcut Şifre';
  String get newPassword              => isEn ? 'New Password'                       : 'Yeni Şifre';
  String get newPasswordConfirm       => isEn ? 'Confirm New Password'               : 'Yeni Şifre (Tekrar)';
  String get passwordsDoNotMatch      => isEn ? 'Passwords do not match'             : 'Şifreler eşleşmiyor';
  String get passwordChangedSuccess   => isEn ? 'Password changed. A confirmation email has been sent.' : 'Şifre değiştirildi. Onay e-postası gönderildi.';
  String get language           => isEn ? 'Language'                 : 'Dil';
  String get signOut            => isEn ? 'Sign Out'                 : 'Çıkış Yap';
  String get signOutConfirmTitle=> isEn ? 'Sign Out'                 : 'Çıkış Yap';
  String get signOutConfirmBody => isEn ? 'Are you sure you want to sign out?' : 'Hesabınızdan çıkış yapmak istediğinize emin misiniz?';
  String get turkish            => isEn ? 'Turkish'                  : 'Türkçe';
  String get english            => isEn ? 'English'                  : 'English';

  // ── Theme ──────────────────────────────────────────────────────────────────
  String get themeLabel         => isEn ? 'Theme'                    : 'Tema';
  String get themeLight         => isEn ? 'Light'                    : 'Açık';
  String get themeDark          => isEn ? 'Dark'                     : 'Koyu';
  String get themeSystem        => isEn ? 'System'                   : 'Sistem';
}
