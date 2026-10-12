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

  static const bool isDebug = kDebugMode;
  static const String appName = 'Salon Yönetimi';
  static const String appVersion = '1.0.0';
}
