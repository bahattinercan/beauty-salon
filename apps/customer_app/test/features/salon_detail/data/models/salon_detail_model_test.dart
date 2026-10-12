import 'dart:convert';

import 'package:customer_app/features/salon_detail/data/models/salon_detail_model.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('SalonDetailModel CA-008 alanları', () {
    test('latitude/longitude/gallery/description/priceRange parse edilir', () {
      final model = SalonDetailModel.fromJson({
        'id': '1',
        'name': 'Salon',
        'address': 'Adres',
        'ratingAvg': 4.5,
        'reviewCount': 3,
        'latitude': 41.0082,
        'longitude': 28.9784,
        'priceRange': 2,
        'description': 'Güzellik ve spa merkezi',
        'galleryImages': ['https://cdn/1.jpg', 'https://cdn/2.jpg'],
      });

      expect(model.latitude, 41.0082);
      expect(model.longitude, 28.9784);
      expect(model.priceRange, 2);
      expect(model.description, 'Güzellik ve spa merkezi');
      expect(model.galleryImages, hasLength(2));
    });

    test('workingHours JSON string olarak gelirse parse edilir', () {
      final model = SalonDetailModel.fromJson({
        'id': '1',
        'name': 'Salon',
        'address': 'Adres',
        'workingHours': jsonEncode({
          'monday': {'open': '09:00', 'close': '18:00'},
        }),
      });

      expect(model.workingHours['monday'], {'open': '09:00', 'close': '18:00'});
    });

    test('eksik alanlar varsayılan değerlerle gelir', () {
      final model = SalonDetailModel.fromJson({
        'id': '1',
        'name': 'Salon',
        'address': 'Adres',
      });

      expect(model.latitude, isNull);
      expect(model.longitude, isNull);
      expect(model.priceRange, 0);
      expect(model.galleryImages, isEmpty);
      expect(model.description, isNull);
    });

    test('toEntity alanları korur', () {
      final entity = SalonDetailModel.fromJson({
        'id': '1',
        'name': 'Salon',
        'address': 'Adres',
        'latitude': 41.0,
        'longitude': 28.9,
        'priceRange': 3,
        'galleryImages': ['a.jpg'],
      }).toEntity();

      expect(entity.latitude, 41.0);
      expect(entity.longitude, 28.9);
      expect(entity.priceRangeLabel, '₺₺₺');
      expect(entity.galleryImages, ['a.jpg']);
    });
  });
}
