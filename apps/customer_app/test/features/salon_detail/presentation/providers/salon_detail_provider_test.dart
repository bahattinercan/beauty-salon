import 'package:fpdart/fpdart.dart';
import 'package:customer_app/core/di/injection.dart';
import 'package:customer_app/features/salon_detail/domain/entities/review_page.dart';
import 'package:customer_app/features/salon_detail/domain/entities/salon_detail.dart';
import 'package:customer_app/features/salon_detail/domain/repositories/salon_detail_repository.dart';
import 'package:customer_app/features/salon_detail/domain/usecases/get_salon_reviews_usecase.dart';
import 'package:customer_app/features/salon_detail/presentation/providers/salon_detail_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockSalonDetailRepository extends Mock implements SalonDetailRepository {}

void main() {
  late ProviderContainer container;
  late MockSalonDetailRepository mockRepo;

  const r1 = SalonReview(
    id: '1', customerName: 'Ada', customerInitials: 'A', rating: 5, createdAt: '2026-01-01',
  );
  const r2 = SalonReview(
    id: '2', customerName: 'Deniz', customerInitials: 'D', rating: 4, createdAt: '2026-01-02',
  );

  ReviewPage page(int n, List<SalonReview> reviews, int totalPages) => ReviewPage(
        reviews: reviews,
        page: n,
        totalPages: totalPages,
        total: reviews.length * totalPages,
      );

  setUp(() async {
    mockRepo = MockSalonDetailRepository();
    // get_it v8: reset() async; await edilmezse kayıt temizlenir.
    await getIt.reset();
    getIt.registerSingleton<GetSalonReviewsUseCase>(GetSalonReviewsUseCase(mockRepo));
    container = ProviderContainer();
  });

  tearDown(() async {
    container.dispose();
    await getIt.reset();
  });

  ReviewPage current(String salonId) =>
      container.read(salonReviewsProvider(salonId)).asData!.value;

  group('SalonReviewsNotifier', () {
    test('ilk yükleme 1. sayfayı getirir', () async {
      when(() => mockRepo.getSalonReviews(
        salonId: any(named: 'salonId'),
        page: any(named: 'page'),
        limit: any(named: 'limit'),
      )).thenAnswer((_) async => Right(page(1, [r1], 3)));

      container.listen(salonReviewsProvider('s1'), (_, _) {});
      await container.read(salonReviewsProvider('s1').future);

      final state = current('s1');
      expect(state.page, 1);
      expect(state.reviews, [r1]);
      expect(state.hasNextPage, isTrue);
    });

    test('loadMore mevcut sayfaya ekler', () async {
      when(() => mockRepo.getSalonReviews(
        salonId: any(named: 'salonId'),
        page: any(named: 'page'),
        limit: any(named: 'limit'),
      )).thenAnswer((invocation) async {
        final p = invocation.namedArguments[#page] as int;
        return Right(p == 1 ? page(1, [r1], 2) : page(2, [r2], 2));
      });

      container.listen(salonReviewsProvider('s1'), (_, _) {});
      await container.read(salonReviewsProvider('s1').future);
      await container.read(salonReviewsProvider('s1').notifier).loadMore();

      final state = current('s1');
      expect(state.page, 2);
      expect(state.reviews, [r1, r2]);
      expect(state.loadingMore, isFalse);
      expect(state.hasNextPage, isFalse);
    });

    test('son sayfada loadMore yeni istek atmaz', () async {
      when(() => mockRepo.getSalonReviews(
        salonId: any(named: 'salonId'),
        page: any(named: 'page'),
        limit: any(named: 'limit'),
      )).thenAnswer((_) async => Right(page(1, [r1], 1)));

      container.listen(salonReviewsProvider('s1'), (_, _) {});
      await container.read(salonReviewsProvider('s1').future);
      await container.read(salonReviewsProvider('s1').notifier).loadMore();

      verify(() => mockRepo.getSalonReviews(
        salonId: 's1',
        page: 1,
        limit: 10,
      )).called(1);
      verifyNoMoreInteractions(mockRepo);
    });

    test('loadMore sırasında loadingMore true olur, sonra false', () async {
      when(() => mockRepo.getSalonReviews(
        salonId: any(named: 'salonId'),
        page: any(named: 'page'),
        limit: any(named: 'limit'),
      )).thenAnswer((invocation) async {
        final p = invocation.namedArguments[#page] as int;
        return Right(p == 1 ? page(1, [r1], 2) : page(2, [r2], 2));
      });

      container.listen(salonReviewsProvider('s1'), (_, _) {});
      await container.read(salonReviewsProvider('s1').future);

      final notifier = container.read(salonReviewsProvider('s1').notifier);
      final future = notifier.loadMore();
      expect(current('s1').loadingMore, isTrue);
      await future;
      expect(current('s1').loadingMore, isFalse);
    });
  });
}
