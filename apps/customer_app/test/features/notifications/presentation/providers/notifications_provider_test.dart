import 'package:fpdart/fpdart.dart';
import 'package:customer_app/core/di/injection.dart';
import 'package:customer_app/features/notifications/domain/entities/notification_item.dart';
import 'package:customer_app/features/notifications/domain/entities/notification_page.dart';
import 'package:customer_app/features/notifications/domain/repositories/notification_repository.dart';
import 'package:customer_app/features/notifications/domain/usecases/get_notifications_usecase.dart';
import 'package:customer_app/features/notifications/domain/usecases/get_unread_count_usecase.dart';
import 'package:customer_app/features/notifications/domain/usecases/mark_notification_read_usecase.dart';
import 'package:customer_app/features/notifications/presentation/providers/notifications_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockNotificationRepository extends Mock implements NotificationRepository {}

void main() {
  late ProviderContainer container;
  late MockNotificationRepository mockRepo;

  const n1 = NotificationItem(
    id: '1',
    title: 'Randevu',
    body: '1 saat sonra',
    type: 'APPOINTMENT',
    createdAt: '2026-01-12',
  );
  const n2 = NotificationItem(
    id: '2',
    title: 'Yorum',
    body: 'Onaylandı',
    type: 'REVIEW',
    isRead: true,
    createdAt: '2026-01-10',
  );

  setUp(() async {
    mockRepo = MockNotificationRepository();
    // get_it v8: reset() async; await edilmezse kayıt temizlenir.
    await getIt.reset();
    getIt.registerSingleton<GetNotificationsUseCase>(GetNotificationsUseCase(mockRepo));
    getIt.registerSingleton<GetUnreadCountUseCase>(GetUnreadCountUseCase(mockRepo));
    getIt.registerSingleton<MarkNotificationReadUseCase>(
        MarkNotificationReadUseCase(mockRepo));

    when(() => mockRepo.getNotifications(
      page: any(named: 'page'),
      limit: any(named: 'limit'),
      isRead: any(named: 'isRead'),
    )).thenAnswer((invocation) async {
      final pageArg = invocation.namedArguments[#page] as int;
      return Right(NotificationPage(
        items: pageArg == 1 ? const [n1] : const [n2],
        page: pageArg,
        totalPages: 2,
        total: 2,
      ));
    });

    when(() => mockRepo.getUnreadCount()).thenAnswer((_) async => const Right(1));
    when(() => mockRepo.markAsRead(any())).thenAnswer((_) async => Right(unit));

    container = ProviderContainer();
  });

  tearDown(() async {
    container.dispose();
    await getIt.reset();
  });

  test('liste ilk sayfayı yükler', () async {
    final page = await container.read(notificationsProvider(null).future);

    expect(page.items, [n1]);
    expect(page.page, 1);
    expect(page.hasNextPage, isTrue);
  });

  test('isRead=false filtresi repositoryye iletilir', () async {
    await container.read(notificationsProvider(false).future);

    verify(() => mockRepo.getNotifications(
      page: 1,
      limit: 20,
      isRead: false,
    )).called(1);
  });

  test('loadMore ikinci sayfayı mevcut listeye ekler', () async {
    await container.read(notificationsProvider(null).future);
    await container.read(notificationsProvider(null).notifier).loadMore();

    final page = container.read(notificationsProvider(null)).asData?.value;

    expect(page?.items, [n1, n2]);
    expect(page?.page, 2);
    expect(page?.hasNextPage, isFalse);
  });

  test('markAsRead bildirimi okundu yapar', () async {
    await container.read(notificationsProvider(null).future);

    await container.read(notificationsProvider(null).notifier).markAsRead('1');

    final page = container.read(notificationsProvider(null)).asData?.value;
    expect(page?.items.first.isRead, isTrue);
  });

  test('unreadCountProvider sayıyı döner', () async {
    expect(await container.read(unreadCountProvider.future), 1);
  });
}
