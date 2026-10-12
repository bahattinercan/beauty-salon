import 'package:fpdart/fpdart.dart';
import 'package:customer_app/core/error/failures.dart';
import 'package:customer_app/features/salon_detail/domain/entities/review_page.dart';
import 'package:customer_app/features/salon_detail/domain/entities/salon_detail.dart';
import 'package:customer_app/features/salon_detail/domain/repositories/salon_detail_repository.dart';
import 'package:customer_app/features/salon_detail/domain/usecases/get_salon_reviews_usecase.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockSalonDetailRepository extends Mock implements SalonDetailRepository {}

void main() {
  late GetSalonReviewsUseCase sut;
  late MockSalonDetailRepository mockRepo;

  const tReview = SalonReview(
    id: '1',
    customerName: 'Ada',
    customerInitials: 'A',
    rating: 5,
    createdAt: '2026-01-01',
  );

  setUp(() {
    mockRepo = MockSalonDetailRepository();
    sut = GetSalonReviewsUseCase(mockRepo);
  });

  test('başarılı çağrıda Right(ReviewPage) döner', () async {
    when(() => mockRepo.getSalonReviews(
          salonId: any(named: 'salonId'),
          page: any(named: 'page'),
          limit: any(named: 'limit'),
        )).thenAnswer((_) async => const Right(ReviewPage(
          reviews: [tReview],
          page: 1,
          totalPages: 3,
          total: 25,
        )));

    final result = await sut(salonId: '1', page: 2, limit: 10);

    expect(result.fold((_) => null, (p) => p.reviews), [tReview]);
    verify(() => mockRepo.getSalonReviews(salonId: '1', page: 2, limit: 10)).called(1);
  });

  test('varsayılan sayfa 1 ve limit 10', () async {
    when(() => mockRepo.getSalonReviews(
          salonId: any(named: 'salonId'),
          page: any(named: 'page'),
          limit: any(named: 'limit'),
        )).thenAnswer((_) async => const Right(ReviewPage(reviews: [], page: 1, totalPages: 1)));

    await sut(salonId: '1');

    verify(() => mockRepo.getSalonReviews(salonId: '1', page: 1, limit: 10)).called(1);
  });

  test('boş liste edge case: Right(ReviewPage) boş reviews ile döner', () async {
    when(() => mockRepo.getSalonReviews(
          salonId: any(named: 'salonId'),
          page: any(named: 'page'),
          limit: any(named: 'limit'),
        )).thenAnswer((_) async => const Right(ReviewPage(reviews: [], page: 1, totalPages: 1)));

    final result = await sut(salonId: '1');

    expect(result.fold((_) => null, (p) => p.reviews), isEmpty);
  });

  test('ServerFailure durumunda Left(ServerFailure) döner', () async {
    when(() => mockRepo.getSalonReviews(
          salonId: any(named: 'salonId'),
          page: any(named: 'page'),
          limit: any(named: 'limit'),
        )).thenAnswer((_) async => const Left(ServerFailure('Sunucu hatası')));

    expect(await sut(salonId: '1'), const Left(ServerFailure('Sunucu hatası')));
  });

  test('NetworkFailure durumunda Left(NetworkFailure) döner', () async {
    when(() => mockRepo.getSalonReviews(
          salonId: any(named: 'salonId'),
          page: any(named: 'page'),
          limit: any(named: 'limit'),
        )).thenAnswer((_) async => const Left(NetworkFailure()));

    expect(await sut(salonId: '1').then((r) => r.fold((f) => f, (_) => null)),
        isA<NetworkFailure>());
  });
}
