import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const _kLocaleKey = 'app_locale';

class LocaleNotifier extends AsyncNotifier<Locale> {
  final _storage = const FlutterSecureStorage();

  @override
  Future<Locale> build() async {
    final saved = await _storage.read(key: _kLocaleKey);
    return saved != null ? Locale(saved) : const Locale('tr');
  }

  Future<void> setLocale(Locale locale) async {
    await _storage.write(key: _kLocaleKey, value: locale.languageCode);
    state = AsyncData(locale);
  }
}

final localeProvider = AsyncNotifierProvider<LocaleNotifier, Locale>(
  LocaleNotifier.new,
);
