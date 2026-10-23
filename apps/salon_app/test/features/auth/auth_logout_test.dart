import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:salon_app/core/network/api_provider.dart';
import 'package:salon_app/features/auth/data/auth_provider.dart';
import '../../core/fake_api.dart';

/// AuthNotifier.logout() davranışı:
///  1. önce POST /auth/logout ile refresh token'ı sunucuda iptal eder,
///  2. sunucu hata verirse bile yerel çıkışı tamamlar.
///
/// FlutterSecureStorage'ın method channel'ı sahte (in-memory) bir implementasyonla
/// değiştirilir; böylece build() oturumlu bir state üretir ve logout() gerçek
/// deleteAll() yolunu izler.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const storageChannel =
      MethodChannel('plugins.it_nomads.com/flutter_secure_storage');
  late Map<String, String> storage;

  setUp(() {
    // Çıkış öncesi oturum açık: build() access_token + user_id okuyabiliyor.
    storage = {
      'access_token': 'access-token-1',
      'refresh_token': 'refresh-token-1',
      'user_id': 'owner-1',
      'user_name': 'Test Owner',
    };

    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(storageChannel, (call) async {
      final args = call.arguments is Map ? call.arguments as Map : const {};
      switch (call.method) {
        case 'read':
          return storage[args['key']?.toString()];
        case 'containsKey':
          return storage.containsKey(args['key']?.toString());
        case 'deleteAll':
          storage.clear();
          return null;
        default:
          return null;
      }
    });
  });

  ProviderContainer containerWith(FakeApi api) {
    final container = ProviderContainer(
      overrides: [apiClientProvider.overrideWithValue(api.client())],
    );
    addTearDown(container.dispose);
    return container;
  }

  group('AuthNotifier.logout', () {
    test('başarılı çıkışta POST /auth/logout çağrılır ve oturum kapanır',
        () async {
      final api = FakeApi(
        responses: {
          '/auth/logout': {'success': true},
        },
      );
      final container = containerWith(api);

      final initial = await container.read(authProvider.future);
      expect(initial.isLoggedIn, isTrue);

      await container.read(authProvider.notifier).logout();

      expect(api.called('POST', '/auth/logout'), isTrue);

      final after = container.read(authProvider);
      expect(after.hasError, isFalse);
      expect(after.value!.isLoggedIn, isFalse);
      expect(after.value!.salonOwnerId, isNull);
      expect(after.value!.fullName, isNull);
      expect(storage, isEmpty);
    });

    test('sunucu 500 dönse de hata fırlatmaz, yerel çıkış tamamlanır',
        () async {
      final api = FakeApi(
        responses: {'/auth/logout': null},
        statusCodes: {'/auth/logout': 500},
      );
      final container = containerWith(api);

      final initial = await container.read(authProvider.future);
      expect(initial.isLoggedIn, isTrue);

      await expectLater(
        container.read(authProvider.notifier).logout(),
        completes,
      );

      expect(api.called('POST', '/auth/logout'), isTrue);

      final after = container.read(authProvider);
      expect(after.hasError, isFalse);
      expect(after.value!.isLoggedIn, isFalse);
      expect(after.value!.salonOwnerId, isNull);
      expect(storage, isEmpty);
    });
  });
}
