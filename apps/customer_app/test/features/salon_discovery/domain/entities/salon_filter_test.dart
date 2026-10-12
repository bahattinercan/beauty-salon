import 'package:customer_app/features/salon_discovery/domain/entities/salon_filter.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('SalonFilter', () {
    test('varsayılan filtre yalnızca limit taşır', () {
      expect(const SalonFilter().toQueryParameters(),
          {'limit': '50', 'sortBy': 'rating'});
    });

    test('aktif filtreler query parametresine dönüşür', () {
      const filter = SalonFilter(
        search: 'saç',
        categoryId: 'c1',
        minRating: 4,
        priceRange: 2,
        verifiedOnly: true,
        sortBy: 'rating',
      );

      final params = filter.toQueryParameters();
      expect(params['search'], 'saç');
      expect(params['categoryId'], 'c1');
      expect(params['minRating'], '4.0');
      expect(params['priceRange'], '2');
      expect(params['verified'], 'true');
      expect(params['sortBy'], 'rating');
    });

    test('backend\'in destekmediği sıralama sortBy olarak gönderilmez', () {
      const filter = SalonFilter(sortBy: 'price_low');
      expect(filter.toQueryParameters().containsKey('sortBy'), isFalse);
    });

    test('hasActiveFilters yalnızca gerçek bir seçim varsa true olur', () {
      expect(const SalonFilter().hasActiveFilters, isFalse);
      expect(const SalonFilter(minRating: 3).hasActiveFilters, isTrue);
      expect(const SalonFilter(verifiedOnly: true).hasActiveFilters, isTrue);
    });

    test('copyWith yalnızca verilen alanı değiştirir', () {
      const base = SalonFilter(search: 'saç', minRating: 3);
      final updated = base.copyWith(minRating: 4);

      expect(updated.search, 'saç');
      expect(updated.minRating, 4);
    });

    test('aynı değerler aynı hash üretir (Riverpod family key)', () {
      const a = SalonFilter(search: 'x', priceRange: 2);
      const b = SalonFilter(search: 'x', priceRange: 2);

      expect(a, b);
      expect(a.hashCode, b.hashCode);
    });
  });
}
