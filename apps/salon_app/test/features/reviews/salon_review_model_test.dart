import 'package:flutter_test/flutter_test.dart';
import 'package:salon_app/features/reviews/data/reviews_provider.dart';

void main() {
  group('SalonReview.fromJson', () {
    test('customer ve service nested alanları okunur', () {
      final r = SalonReview.fromJson({
        'id': 'rv1',
        'rating': 5,
        'comment': 'Çok iyi',
        'salonReply': 'Teşekkürler',
        'createdAt': '2026-10-01T10:00:00.000Z',
        'customer': {'fullName': 'Ayşe Yılmaz'},
        'appointment': {'service': {'name': 'Saç Kesimi'}},
      });

      expect(r.customerName, 'Ayşe Yılmaz');
      expect(r.serviceName, 'Saç Kesimi');
      expect(r.rating, 5.0);
      expect(r.hasReply, true);
    });

    test('nested nulllar crash etmez, defaultlar kullanılır', () {
      final r = SalonReview.fromJson({'id': 'rv2'});

      expect(r.customerName, 'Müşteri');
      expect(r.rating, 0.0);
      expect(r.comment, isNull);
      expect(r.replyText, isNull);
      expect(r.serviceName, isNull);
      expect(r.hasReply, false);
      expect(r.createdAt, isA<DateTime>());
    });
  });
}
