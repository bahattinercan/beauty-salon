import 'package:flutter_test/flutter_test.dart';
import 'package:salon_app/features/reviews/data/reviews_provider.dart';

void main() {
  group('ReviewFeed', () {
    test('hasMore yüklenen sayısı toplamdan az ise true', () {
      const feed = ReviewFeed(reviews: [], total: 25, page: 1, limit: 20);
      expect(feed.hasMore, true);

      final allLoaded = ReviewFeed(
        reviews: List.generate(5, (i) => SalonReview.fromJson({'id': 'r$i'})),
        total: 5,
        page: 1,
        limit: 20,
      );
      expect(allLoaded.hasMore, false);
    });

    test('sayfa ilerledikçe hasMore kapanır', () {
      final second = ReviewFeed(
        reviews: List.generate(20, (i) => SalonReview.fromJson({'id': 'r$i'})),
        total: 25,
        page: 2,
        limit: 20,
      );
      expect(second.hasMore, true);

      final third = ReviewFeed(
        reviews: List.generate(25, (i) => SalonReview.fromJson({'id': 'r$i'})),
        total: 25,
        page: 3,
        limit: 20,
      );
      expect(third.hasMore, false);
    });
  });
}
