import 'package:flutter_test/flutter_test.dart';
import 'package:salon_app/app/environment.dart';
import 'package:salon_app/core/network/media_url.dart';

void main() {
  group('resolveMediaUrl', () {
    test('kök-göreli yolu API origin\'i ile tamamlar (/api/v1 öneki eklemez)', () {
      expect(
        resolveMediaUrl('/uploads/a.jpg'),
        '${ApiEnvironment.mediaUrl}/uploads/a.jpg',
      );
      expect(
        resolveMediaUrl('/uploads/a.jpg'),
        isNot(contains('/api/v1')),
      );
    });

    test('baştaki slash olmadan da çalışır', () {
      expect(
        resolveMediaUrl('uploads/a.jpg'),
        '${ApiEnvironment.mediaUrl}/uploads/a.jpg',
      );
    });

    test('mutlak URL\'leri olduğu gibi bırakır (idempotent)', () {
      const absolute = 'https://cdn.example.com/uploads/a.jpg';
      expect(resolveMediaUrl(absolute), absolute);
      expect(resolveMediaUrl(resolveMediaUrl('/uploads/a.jpg')),
          startsWith('http'));
      expect(resolveMediaUrl(resolveMediaUrl('/uploads/a.jpg')),
          resolveMediaUrl('/uploads/a.jpg'));
    });

    test('null / boş / whitespace için boş string döner', () {
      expect(resolveMediaUrl(null), '');
      expect(resolveMediaUrl(''), '');
      expect(resolveMediaUrl('   '), '');
    });
  });
}
