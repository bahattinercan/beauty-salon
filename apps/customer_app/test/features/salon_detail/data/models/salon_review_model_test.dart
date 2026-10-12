import 'package:flutter_test/flutter_test.dart';
import 'package:customer_app/features/salon_detail/data/models/salon_detail_model.dart';

void main() {
  group('SalonReviewModel.fromJson', () {
    test('images listesi parse edilir', () {
      final model = SalonReviewModel.fromJson({
        'id': 'rv1',
        'rating': 5,
        'comment': 'Çok iyi',
        'createdAt': '2026-07-01T10:00:00.000Z',
        'customer': {'fullName': 'Ayşe Yılmaz'},
        'appointment': {'service': {'name': 'Saç Kesimi'}},
        'images': ['https://cdn/1.jpg', 'https://cdn/2.jpg'],
      });

      expect(model.images, ['https://cdn/1.jpg', 'https://cdn/2.jpg']);
      expect(model.customerInitials, 'AY');
      expect(model.serviceName, 'Saç Kesimi');
    });

    test('images yoksa boş liste', () {
      final model = SalonReviewModel.fromJson({
        'id': 'rv2',
        'rating': 4,
        'createdAt': '2026-07-02T10:00:00.000Z',
        'customer': {'fullName': 'Ali Can'},
      });

      expect(model.images, isEmpty);
    });

    test('toEntity images taşıyor', () {
      final entity = SalonReviewModel.fromJson({
        'id': 'rv3',
        'rating': 3,
        'createdAt': '2026-07-03T10:00:00.000Z',
        'customer': {'fullName': 'Deniz Ak'},
        'images': ['https://cdn/a.jpg'],
      }).toEntity();

      expect(entity.images.length, 1);
      expect(entity.timeAgo, isNotEmpty);
    });
  });
}
