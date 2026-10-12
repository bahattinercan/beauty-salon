import 'package:fpdart/fpdart.dart';
import 'package:customer_app/core/error/failures.dart';
import 'package:customer_app/features/notifications/domain/repositories/notification_repository.dart';
import 'package:customer_app/features/notifications/domain/usecases/get_unread_count_usecase.dart';
import 'package:customer_app/features/notifications/domain/usecases/mark_all_notifications_read_usecase.dart';
import 'package:customer_app/features/notifications/domain/usecases/mark_notification_read_usecase.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockNotificationRepository extends Mock implements NotificationRepository {}

void main() {
  late MockNotificationRepository mockRepo;

  setUp(() => mockRepo = MockNotificationRepository());

  group('GetUnreadCountUseCase', () {
    test('Right(count) döner', () async {
      when(() => mockRepo.getUnreadCount()).thenAnswer((_) async => const Right(3));

      final result = await GetUnreadCountUseCase(mockRepo)();

      expect(result, const Right(3));
    });

    test('NetworkFailure durumunda Left döner', () async {
      when(() => mockRepo.getUnreadCount()).thenAnswer((_) async => const Left(NetworkFailure()));

      final result = await GetUnreadCountUseCase(mockRepo)();

      expect(result.fold((f) => f, (_) => null), isA<NetworkFailure>());
    });
  });

  group('MarkNotificationReadUseCase', () {
    test('Right(unit) döner ve repository çağrılır', () async {
      when(() => mockRepo.markAsRead(any())).thenAnswer((_) async => Right(unit));

      final result = await MarkNotificationReadUseCase(mockRepo)('id-1');

      expect(result, Right(unit));
      verify(() => mockRepo.markAsRead('id-1')).called(1);
    });

    test('ServerFailure durumunda Left döner', () async {
      when(() => mockRepo.markAsRead(any()))
          .thenAnswer((_) async => const Left(ServerFailure('Bildirim bulunamadı')));

      final result = await MarkNotificationReadUseCase(mockRepo)('id-1');

      expect(result.fold((f) => f, (_) => null), isA<ServerFailure>());
    });
  });

  group('MarkAllNotificationsReadUseCase', () {
    test('Right(unit) döner', () async {
      when(() => mockRepo.markAllAsRead()).thenAnswer((_) async => Right(unit));

      final result = await MarkAllNotificationsReadUseCase(mockRepo)();

      expect(result, Right(unit));
      verify(() => mockRepo.markAllAsRead()).called(1);
    });
  });
}
