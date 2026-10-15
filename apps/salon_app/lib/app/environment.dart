// ignore_for_file: dangling_library_doc_comments
/// API environment configuration
import 'package:flutter/foundation.dart';

class ApiEnvironment {
  static String get baseUrl {
    if (kDebugMode) {
      return 'http://10.0.2.2:3000/api/v1'; // Android emulator
    }
    // In production, replace with your actual API URL
    return 'https://api.salonyonetimi.com/api/v1';
  }

  /// Yüklenen dosyalar statik olarak API kökünde servis edilir (`/uploads/x.jpg`),
  /// API rotaları ise `/api/v1` altındadır. Bu yüzden medya URL'leri `baseUrl` ile
  /// değil, origin ile tamamlanmalıdır.
  static String get mediaUrl {
    const override = String.fromEnvironment('MEDIA_BASE_URL');
    if (override.isNotEmpty) return override;

    final base = Uri.parse(baseUrl);
    return '${base.scheme}://${base.authority}';
  }

  static const bool isDebug = kDebugMode;
  static const String appName = 'Salon Yönetimi';
  static const String appVersion = '1.0.0';
}
