import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:injectable/injectable.dart';

abstract class OnboardingLocalDataSource {
  /// Bayrak hiç yazılmadıysa `false` (ilk kurulumda onboarding gösterilir).
  Future<bool> readSeen();

  Future<void> writeSeen(bool value);
}

/// `theme_provider.dart` gibi `flutter_secure_storage` kullanılır; yeni bir
/// paket (`shared_preferences`) eklenmez — CLAUDE.md §14 paket hijyeni.
@Injectable(as: OnboardingLocalDataSource)
class OnboardingSecureStorageDataSource implements OnboardingLocalDataSource {
  static const _key = 'onboarding_seen';

  final FlutterSecureStorage _storage;
  OnboardingSecureStorageDataSource(this._storage);

  @override
  Future<bool> readSeen() async =>
      await _storage.read(key: _key) == 'true';

  @override
  Future<void> writeSeen(bool value) async =>
      await _storage.write(key: _key, value: value ? 'true' : 'false');
}
