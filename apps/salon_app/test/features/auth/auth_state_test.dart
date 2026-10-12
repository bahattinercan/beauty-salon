import 'package:flutter_test/flutter_test.dart';
import 'package:salon_app/features/auth/data/auth_provider.dart';

void main() {
  group('AuthProvider Tests', () {
    test('AuthState.initial should have isLoggedIn = false', () {
      const state = AuthState.initial();
      expect(state.isLoggedIn, isFalse);
      expect(state.salonOwnerId, isNull);
      expect(state.fullName, isNull);
    });

    test('AuthState should store user data correctly', () {
      const state = AuthState(isLoggedIn: true, salonOwnerId: '123', fullName: 'Test User');
      expect(state.isLoggedIn, isTrue);
      expect(state.salonOwnerId, '123');
      expect(state.fullName, 'Test User');
    });
  });
}
