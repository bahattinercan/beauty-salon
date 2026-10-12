import 'package:fpdart/fpdart.dart';
import 'package:customer_app/core/error/failures.dart';
import 'package:customer_app/features/reviews/domain/repositories/reviews_repository.dart';
import 'package:customer_app/features/reviews/domain/usecases/create_review_usecase.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockReviewsRepository extends Mock implements ReviewsRepository {}

void main() {
  late CreateReviewUseCase sut;
  late MockReviewsRepository mockRepo;

  setUp(() {
    mockRepo = MockReviewsRepository();
    sut = CreateReviewUseCase(mockRepo);
  });

  test('başarılı çağrıda Right(unit) döner', () async {
    when(() => mockRepo.createReview(
      appointmentId: any(named: 'appointmentId'),
      rating: any(named: 'rating'),
      comment: any(named: 'comment'),
      images: any(named: 'images'),
    )).thenAnswer((_) async => const Right(unit));

    final result = await sut(
      appointmentId: 'a1',
      rating: 5,
      comment: 'harika',
      images: ['u1'],
    );

    expect(result, const Right(unit));
    verify(() => mockRepo.createReview(
      appointmentId: 'a1',
      rating: 5,
      comment: 'harika',
      images: ['u1'],
    )).called(1);
  });

  test('comment ve images verilmezse null iletilir', () async {
    when(() => mockRepo.createReview(
      appointmentId: any(named: 'appointmentId'),
      rating: any(named: 'rating'),
      comment: any(named: 'comment'),
      images: any(named: 'images'),
    )).thenAnswer((_) async => const Right(unit));

    await sut(appointmentId: 'a1', rating: 4);

    verify(() => mockRepo.createReview(
      appointmentId: 'a1',
      rating: 4,
      comment: null,
      images: null,
    )).called(1);
  });

  test('rating 0 edge case: olduğu gibi iletilir', () async {
    when(() => mockRepo.createReview(
      appointmentId: any(named: 'appointmentId'),
      rating: any(named: 'rating'),
      comment: any(named: 'comment'),
      images: any(named: 'images'),
    )).thenAnswer((_) async => const Right(unit));

    await sut(appointmentId: 'a1', rating: 0);

    verify(() => mockRepo.createReview(
      appointmentId: 'a1',
      rating: 0,
      comment: null,
      images: null,
    )).called(1);
  });

  test('ServerFailure durumunda Left(ServerFailure) döner', () async {
    when(() => mockRepo.createReview(
      appointmentId: any(named: 'appointmentId'),
      rating: any(named: 'rating'),
      comment: any(named: 'comment'),
      images: any(named: 'images'),
    )).thenAnswer((_) async => const Left(ServerFailure('Randevu bulunamadı')));

    expect(
      await sut(appointmentId: 'a1', rating: 5),
      const Left(ServerFailure('Randevu bulunamadı')),
    );
  });

  test('NetworkFailure durumunda Left(NetworkFailure) döner', () async {
    when(() => mockRepo.createReview(
      appointmentId: any(named: 'appointmentId'),
      rating: any(named: 'rating'),
      comment: any(named: 'comment'),
      images: any(named: 'images'),
    )).thenAnswer((_) async => const Left(NetworkFailure()));

    final result = await sut(appointmentId: 'a1', rating: 5);

    expect(result.fold((f) => f, (_) => null), isA<NetworkFailure>());
  });
}
