import 'package:customer_app/features/salon_detail/domain/entities/review_page.dart';
import 'package:customer_app/features/salon_detail/domain/entities/salon_detail.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const r1 = SalonReview(
    id: '1',
    customerName: 'Ada',
    customerInitials: 'A',
    rating: 5,
    createdAt: '2026-01-01',
  );
  const r2 = SalonReview(
    id: '2',
    customerName: 'Deniz',
    customerInitials: 'D',
    rating: 4,
    createdAt: '2026-01-02',
  );

  group('ReviewPage', () {
    test('hasNextPage yalnızca son sayfada değilken true', () {
      expect(const ReviewPage(reviews: [r1], page: 1, totalPages: 3).hasNextPage, isTrue);
      expect(const ReviewPage(reviews: [r1], page: 3, totalPages: 3).hasNextPage, isFalse);
      expect(const ReviewPage(reviews: [], page: 1, totalPages: 1).hasNextPage, isFalse);
    });

    test('copyWith yalnızca verilen alanı değiştirir', () {
      const base = ReviewPage(reviews: [r1], page: 1, totalPages: 2, total: 12);
      final updated = base.copyWith(loadingMore: true);

      expect(updated.reviews, [r1]);
      expect(updated.page, 1);
      expect(updated.totalPages, 2);
      expect(updated.total, 12);
      expect(updated.loadingMore, isTrue);
    });

    test('append yeni sayfayı mevcut listenin sonuna ekler', () {
      const first = ReviewPage(reviews: [r1], page: 1, totalPages: 2, total: 2);
      const second = ReviewPage(reviews: [r2], page: 2, totalPages: 2, total: 2);

      final merged = first.copyWith(reviews: [...first.reviews, ...second.reviews], page: 2);

      expect(merged.reviews, [r1, r2]);
      expect(merged.page, 2);
      expect(merged.hasNextPage, isFalse);
    });
  });
}
