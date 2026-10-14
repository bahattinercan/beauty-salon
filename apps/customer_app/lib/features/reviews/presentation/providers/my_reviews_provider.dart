import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/di/injection.dart';
import '../../domain/entities/review.dart';
import '../../domain/usecases/get_my_reviews_usecase.dart';

/// Kullanıcının yorumları. Yorumlarım ekranı ve profil istatistikleri
/// aynı kaynağı kullanır (eskiden provider ekran dosyasının içindeydi).
final myReviewsProvider = FutureProvider.autoDispose<List<Review>>((ref) async {
  final result = await getIt<GetMyReviewsUseCase>()();
  return result.fold((failure) => throw failure, (reviews) => reviews);
});
