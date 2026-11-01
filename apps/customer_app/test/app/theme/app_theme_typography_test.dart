import 'package:customer_app/app/theme/app_theme.dart';
import 'package:flutter_test/flutter_test.dart';

/// LX-002 / CA-024: Google Fonts paketi fontu ilk kullanımda runtime'da indirir.
/// Ağ yoksa `fontFamily` çözülemez ve Flutter sistemin son çare çizimine düşer
/// (boş/tofu kutu). Asset bundle'a font gömmeden çözüm, her stile platformun
/// hazır fontlarından oluşan bir `fontFamilyFallback` zinciri vermek.
///
/// Bu test AĞA ÇIKMAZ: `AppTheme` üzerindeki tema kurucuları çağrılmaz.
/// Tema kurulumu font indirmesini tetiklediği için HTTP'ye gidiyor ve test
/// ortamı isteği reddettiğinde bütün suite kırılıyordu. Burada yalnızca sabit
/// fallback listeleri (`serifFallback`, `sansFallback`) doğrulanır; sabit liste
/// okumak hiçbir font yükleme sınıfını çalıştırmaz.
void main() {
  group('AppTheme fallback zincirleri (ağsız)', () {
    test('serif zinciri Georgia → Times New Roman → serif, serif son çare', () {
      final serif = AppTheme.serifFallback;

      expect(serif, isNotEmpty);
      expect(serif.length, greaterThanOrEqualTo(2));
      expect(serif, contains('Georgia'));
      expect(serif, contains('Times New Roman'));
      expect(serif.last, 'serif', reason: 'serif jenerik ailesi son çare olmalı');
    });

    test('sans zinciri sans-serif jenerik ailesini taşır', () {
      final sans = AppTheme.sansFallback;

      expect(sans, isNotEmpty);
      expect(sans.length, greaterThanOrEqualTo(2));
      expect(sans, contains('sans-serif'));
      expect(sans.last, 'sans-serif', reason: 'sans-serif jenerik ailesi son çare olmalı');
    });

    test('serif ve sans zincirleri birbirine karışmaz', () {
      final serif = AppTheme.serifFallback.toSet();
      final sans = AppTheme.sansFallback.toSet();

      expect(serif.intersection(sans), isEmpty);
      expect(AppTheme.serifFallback, isNot(contains('sans-serif')));
      expect(AppTheme.sansFallback, isNot(contains('serif')));
    });
  });
}
