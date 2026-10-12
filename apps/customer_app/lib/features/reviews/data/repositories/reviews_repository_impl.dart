import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import 'package:injectable/injectable.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/review.dart';
import '../../domain/repositories/reviews_repository.dart';
import '../datasources/reviews_remote_datasource.dart';

@Injectable(as: ReviewsRepository)
class ReviewsRepositoryImpl implements ReviewsRepository {
  final ReviewsRemoteDataSource _remote;
  ReviewsRepositoryImpl(this._remote);

  @override
  Future<Either<Failure, List<Review>>> getMyReviews() async {
    try {
      final models = await _remote.getMyReviews();
      return Right(models.map((m) => m.toEntity()).toList());
    } on DioException catch (e) {
      return Left(ServerFailure(e.message ?? 'Sunucu hatası'));
    } catch (_) {
      return const Left(NetworkFailure());
    }
  }

  @override
  Future<Either<Failure, Unit>> createReview({
    required String appointmentId,
    required int rating,
    String? comment,
    List<String>? images,
  }) async {
    try {
      await _remote.createReview(
        appointmentId: appointmentId,
        rating: rating,
        comment: comment,
        images: images,
      );
      return const Right(unit);
    } on DioException catch (e) {
      final msg = e.response?.data?['message'];
      return Left(ServerFailure(
        msg is List ? msg.first.toString() : msg?.toString() ?? 'Sunucu hatası',
      ));
    } catch (_) {
      return const Left(NetworkFailure());
    }
  }
}
