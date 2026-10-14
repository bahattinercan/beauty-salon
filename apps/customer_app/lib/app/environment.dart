import 'package:flutter/foundation.dart';

/// API environment configuration
class ApiEnvironment {
  ApiEnvironment._();

  /// Base URL for the API
  static String get baseUrl {
    // Derlemede override edilebilir: --dart-define=API_BASE_URL=http://localhost:3200/api/v1
    const override = String.fromEnvironment('API_BASE_URL');
    if (override.isNotEmpty) return override;

    if (kIsWeb) {
      return 'http://localhost:3000/api/v1';
    }
    // Android emulator uses 10.0.2.2 to reach host machine
    // iOS simulator uses localhost
    if (kDebugMode) {
      return 'http://10.0.2.2:3000/api/v1';
    }
    // Production URL — replace with your actual API URL
    return 'https://api.beautysalon.com/api/v1';
  }

  /// WebSocket base URL (for real-time notifications)
  static String get wsUrl {
    const override = String.fromEnvironment('WS_BASE_URL');
    if (override.isNotEmpty) return override;

    if (kIsWeb) {
      return 'http://localhost:3000';
    }
    if (kDebugMode) {
      return 'ws://10.0.2.2:3000';
    }
    return 'wss://api.beautysalon.com';
  }

  /// Image/media CDN base URL
  static String get mediaUrl {
    const override = String.fromEnvironment('MEDIA_BASE_URL');
    if (override.isNotEmpty) return override;

    if (kIsWeb) {
      return 'http://localhost:3000';
    }
    if (kDebugMode) {
      return 'http://10.0.2.2:3000';
    }
    return 'https://api.beautysalon.com';
  }

  /// Whether we're in debug mode
  static const bool isDebug = kDebugMode;

  /// App metadata
  static const String appName = 'Beauty Salon';
  static const String appVersion = '1.0.0';
}
