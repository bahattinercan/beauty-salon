import 'package:fpdart/fpdart.dart';
import 'package:customer_app/core/error/failures.dart';
import 'package:customer_app/features/reviews/domain/entities/review.dart';
import 'package:customer_app/features/reviews/domain/repositories/reviews_repository.dart';
import 'package:customer_app/features/reviews/domain/usecases/get_my_reviews_usecase.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockReviewsRepository extends Mock implements ReviewsRepository {}

void main() {
  late GetMyReviewsUseCase sut;
  late MockReviewsRepository mockRepo;

  final tReview = Review(
    id: '1',
    salonId: 's1',
    salonName: 'Salon A',
    rating: 5,
    createdAt: DateTime(2026, 1, 1),
  );

  setUp(() {
    mockRepo = MockReviewsRepository();
    sut = GetMyReviewsUseCase(mockRepo);
  });

  test('başarılı çağrıda Right(List<Review>) döner', () async {
    when(() => mockRepo.getMyReviews()).thenAnswer((_) async => Right([tReview]));

    final result = await sut();

    // Review == tanımlı değil, kimlik karşılaştırması yapılır.
    expect(result.fold((_) => null, (list) => list.single), same(tReview));
    verify(() => mockRepo.getMyReviews()).called(1);
  });

  test('boş liste edge case: Right([]) döner', () async {
    when(() => mockRepo.getMyReviews())
        .thenAnswer((_) async => const Right(<Review>[]));

    final result = await sut();

    expect(result.fold((_) => null, (list) => list), isEmpty);
  });

  test('ServerFailure durumunda Left(ServerFailure) döner', () async {
    when(() => mockRepo.getMyReviews())
        .thenAnswer((_) async => const Left(ServerFailure('Sunucu hatası')));

    expect(await sut(), const Left(ServerFailure('Sunucu hatası')));
  });

  test('NetworkFailure durumunda Left(NetworkFailure) döner', () async {
    when(() => mockRepo.getMyReviews())
        .thenAnswer((_) async => const Left(NetworkFailure()));

    expect(await sut().then((r) => r.fold((f) => f, (_) => null)), isA<NetworkFailure>());
  });
}
