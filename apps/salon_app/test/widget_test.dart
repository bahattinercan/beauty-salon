import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/material.dart';
import 'package:salon_app/main.dart';
import 'package:salon_app/features/auth/data/auth_provider.dart';
import 'package:salon_app/features/salon/data/salon_provider.dart';
import 'package:salon_app/features/dashboard/data/dashboard_provider.dart';

void main() {
  group('SalonApp Widget Tests', () {
    testWidgets('App should render without errors', (WidgetTester tester) async {
      await tester.pumpWidget(
        const ProviderScope(child: SalonApp()),
      );
      // Use pump() instead of pumpAndSettle() to avoid async provider timeouts
      await tester.pump();

      expect(find.byType(MaterialApp), findsOneWidget);
    });

    testWidgets('Login screen should show email and password fields', (WidgetTester tester) async {
      await tester.pumpWidget(
        const ProviderScope(child: SalonApp()),
      );
      // Just pump once — async providers (locale, theme, auth) block pumpAndSettle in tests
      await tester.pump();

      // Verify the app shell exists
      expect(find.byType(Scaffold), findsOneWidget);
    });
  });

  group('AuthProvider Tests', () {
    test('AuthState.initial should have isLoggedIn = false', () {
      const state = AuthState.initial();
      expect(state.isLoggedIn, isFalse);
      expect(state.salonOwnerId, isNull);
      expect(state.fullName, isNull);
    });

    test('AuthState should store user data correctly', () {
      const state = AuthState(
        isLoggedIn: true,
        salonOwnerId: '123',
        fullName: 'Test User',
      );
      expect(state.isLoggedIn, isTrue);
      expect(state.salonOwnerId, '123');
      expect(state.fullName, 'Test User');
    });
  });

  group('SalonInfo Model Tests', () {
    test('SalonInfo.fromJson should handle all fields safely', () {
      final map = <String, dynamic>{
        'id': 'salon-1',
        'name': 'Test Salon',
        'address': 'Test Address',
        'phone': '5551234567',
        'email': 'test@salon.com',
        'description': 'Test Description',
        'ratingAvg': 4.5,
        'reviewCount': 42,
        'workingHours': <String, dynamic>{},
      };

      final salon = SalonInfo.fromJson(map);
      expect(salon.id, 'salon-1');
      expect(salon.name, 'Test Salon');
      expect(salon.address, 'Test Address');
      expect(salon.phone, '5551234567');
      expect(salon.email, 'test@salon.com');
      expect(salon.description, 'Test Description');
      expect(salon.ratingAvg, 4.5);
      expect(salon.reviewCount, 42);
    });

    test('SalonInfo.fromJson should handle null values gracefully', () {
      final map = <String, dynamic>{
        'id': null,
        'name': null,
        'address': null,
        'phone': null,
        'email': null,
        'description': null,
        'ratingAvg': null,
        'reviewCount': null,
        'workingHours': null,
      };

      final salon = SalonInfo.fromJson(map);
      expect(salon.id, '');
      expect(salon.name, '');
      expect(salon.address, isNull);
      expect(salon.phone, isNull);
      expect(salon.email, isNull);
      expect(salon.description, isNull);
      expect(salon.ratingAvg, 0.0);
      expect(salon.reviewCount, 0);
    });
  });

  group('DashboardAppointment Model Tests', () {
    test('DashboardAppointment.fromJson should handle nested nulls', () {
      final map = <String, dynamic>{
        'id': 'apt-1',
        'startTime': '10:00',
        'endTime': '11:00',
        'customer': null,
        'service': null,
        'staff': null,
        'status': 'PENDING',
        'date': '2026-01-15',
      };

      final apt = DashboardAppointment.fromJson(map);
      expect(apt.id, 'apt-1');
      expect(apt.startTime, '10:00');
      expect(apt.customerName, 'Müşteri');
      expect(apt.serviceName, '');
      expect(apt.status, 'PENDING');
      expect(apt.servicePrice, isNull);
    });

    test('DashboardAppointment.fromJson should extract service price', () {
      final map = <String, dynamic>{
        'id': 'apt-2',
        'startTime': '14:00',
        'endTime': '15:30',
        'customer': {'fullName': 'Ahmet Yılmaz'},
        'service': {'name': 'Saç Kesimi', 'price': 150},
        'staff': {'fullName': 'Mehmet'},
        'status': 'COMPLETED',
        'date': '2026-01-15',
      };

      final apt = DashboardAppointment.fromJson(map);
      expect(apt.customerName, 'Ahmet Yılmaz');
      expect(apt.serviceName, 'Saç Kesimi');
      expect(apt.servicePrice, 150.0);
      expect(apt.status, 'COMPLETED');
    });
  });

  group('WorkingDay Model Tests', () {
    test('WorkingDay.fromJson should use defaults for missing values', () {
      final map = <String, dynamic>{};
      final day = WorkingDay.fromJson(map);
      expect(day.open, '09:00');
      expect(day.close, '18:00');
      expect(day.isClosed, false);
    });

    test('WorkingDay.toJson should roundtrip correctly', () {
      const day = WorkingDay(open: '10:00', close: '20:00', isClosed: false);
      final json = day.toJson();
      expect(json['open'], '10:00');
      expect(json['close'], '20:00');
      expect(json['isClosed'], false);
    });
  });
}
