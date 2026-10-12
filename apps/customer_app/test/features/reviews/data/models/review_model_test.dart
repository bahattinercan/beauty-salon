import 'package:flutter_test/flutter_test.dart';
import 'package:customer_app/features/reviews/data/models/review_model.dart';

void main() {
  group('ReviewModel.fromJson', () {
    test('images alanını string listeye çevirir', () {
      final model = ReviewModel.fromJson({
        'id': 'r1',
        'rating': 5,
        'comment': 'Harika',
        'createdAt': '2026-07-01T10:00:00.000Z',
        'salon': {'id': 's1', 'name': 'Elegance', 'logoUrl': 'https://cdn/logo.png'},
        'images': ['https://cdn/1.jpg', 'https://cdn/2.jpg'],
      });

      expect(model.images, ['https://cdn/1.jpg', 'https://cdn/2.jpg']);
      expect(model.salonId, 's1');
      expect(model.rating, 5);
    });

    test('images yoksa boş liste döner', () {
      final model = ReviewModel.fromJson({
        'id': 'r2',
        'rating': 4,
        'createdAt': '2026-07-02T10:00:00.000Z',
        'salon': {'id': 's2', 'name': 'Salon'},
      });

      expect(model.images, isEmpty);
    });

    test('images null veya boş string içeriyorsa filtrelenir', () {
      final model = ReviewModel.fromJson({
        'id': 'r3',
        'rating': 3,
        'createdAt': '2026-07-03T10:00:00.000Z',
        'salon': {'id': 's3', 'name': 'Salon'},
        'images': [null, '', 'https://cdn/ok.jpg'],
      });

      expect(model.images, ['https://cdn/ok.jpg']);
    });

    test('toEntity images dahil tüm alanları taşır', () {
      final entity = ReviewModel.fromJson({
        'id': 'r4',
        'rating': 2,
        'salonReply': 'Teşekkürler',
        'createdAt': '2026-07-04T10:00:00.000Z',
        'salon': {'id': 's4', 'name': 'Salon 4'},
        'images': ['https://cdn/a.jpg'],
      }).toEntity();

      expect(entity.images.length, 1);
      expect(entity.salonReply, 'Teşekkürler');
      expect(entity.timeAgo, isNotEmpty);
    });
  });
}
