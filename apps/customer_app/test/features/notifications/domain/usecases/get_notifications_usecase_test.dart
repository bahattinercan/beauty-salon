import 'package:fpdart/fpdart.dart';
import 'package:customer_app/core/error/failures.dart';
import 'package:customer_app/features/notifications/domain/entities/notification_page.dart';
import 'package:customer_app/features/notifications/domain/repositories/notification_repository.dart';
import 'package:customer_app/features/notifications/domain/usecases/get_notifications_usecase.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockNotificationRepository extends Mock implements NotificationRepository {}

void main() {
  late GetNotificationsUseCase sut;
  late MockNotificationRepository mockRepo;

  const page = NotificationPage(items: [], page: 1, totalPages: 1);

  setUp(() {
    mockRepo = MockNotificationRepository();
    sut = GetNotificationsUseCase(mockRepo);
  });

  test('varsayılan sayfa/limit ile çağırır', () async {
    when(() => mockRepo.getNotifications(
      page: any(named: 'page'),
      limit: any(named: 'limit'),
      isRead: any(named: 'isRead'),
    )).thenAnswer((_) async => const Right(page));

    final result = await sut();

    expect(result, const Right(page));
    verify(() => mockRepo.getNotifications(
      page: 1,
      limit: 20,
      isRead: null,
    )).called(1);
  });

  test('isRead=false filtresi iletilir', () async {
    when(() => mockRepo.getNotifications(
      page: any(named: 'page'),
      limit: any(named: 'limit'),
      isRead: any(named: 'isRead'),
    )).thenAnswer((_) async => const Right(page));

    await sut(page: 2, limit: 10, isRead: false);

    verify(() => mockRepo.getNotifications(page: 2, limit: 10, isRead: false)).called(1);
  });

  test('ServerFailure durumunda Left döner', () async {
    when(() => mockRepo.getNotifications(
      page: any(named: 'page'),
      limit: any(named: 'limit'),
      isRead: any(named: 'isRead'),
    )).thenAnswer((_) async => const Left(ServerFailure('Sunucu hatası')));

    final result = await sut();

    expect(result.fold((f) => f, (_) => null), isA<ServerFailure>());
  });
}
