import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/di/injection.dart';

const _kThemeKey = 'app_theme';

class ThemeNotifier extends AsyncNotifier<ThemeMode> {
  FlutterSecureStorage get _storage => getIt<FlutterSecureStorage>();

  @override
  Future<ThemeMode> build() async {
    final saved = await _storage.read(key: _kThemeKey);
    return saved == 'dark' ? ThemeMode.dark : ThemeMode.light;
  }

  Future<void> toggle() async {
    final current = state.asData?.value ?? ThemeMode.light;
    final next = current == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    await _storage.write(key: _kThemeKey, value: next == ThemeMode.dark ? 'dark' : 'light');
    state = AsyncData(next);
  }
}

final themeProvider = AsyncNotifierProvider<ThemeNotifier, ThemeMode>(
  ThemeNotifier.new,
);
