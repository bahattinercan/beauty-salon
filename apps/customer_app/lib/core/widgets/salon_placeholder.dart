import 'package:flutter/material.dart';

import '../widgets/category_icon.dart';

/// Salon görseli yokken (API `cover_image_url`/`logo_url` boş ya da URL bozuk)
/// gösterilen **tasarlanmış** yer tutucu.
///
/// Neden düz tek renk blok değil: seed'de salonlara görsel bağlanmadığı için
/// 12 kartın hepsi özdeş mor blokta `Icons.spa_outlined` ile duruyordu
/// (bkz. screenshots/customer_app/fix18_discover_final.png) ve liste "yüklenmemiş"
/// görünüyordu. Burada renk ve ikon `salon.id`'den deterministik türetilir:
/// aynı salon her zaman aynı rengi/ikonu alır, kartlar birbirinden ayırt edilir.
class SalonPlaceholder extends StatelessWidget {
  /// Deterministik tohum — genellikle `salon.id`.
  final String seed;

  /// `ServiceCategory.iconName` veya kategori adı (`categoryIcon()` eşler).
  /// Boşsa ikonu da `seed`'den deterministik seçer — böylece görselsiz listede
  /// her salon farklı görünebilir.
  final String iconName;

  /// Ekran okuyucu için kart adı.
  final String semanticsLabel;

  final double? height;
  final BorderRadius? borderRadius;

  /// Dekoratif palet; metin zemini olarak kullanılmaz, üzerindeki ikon düşük
  /// opaklıkta olduğu için kontrast iddiası taşımaz.
  static const List<List<Color>> _variants = [
    [Color(0xFF7C5CBF), Color(0xFF5A42A0)],
    [Color(0xFF5B8DEF), Color(0xFF3F6FD1)],
    [Color(0xFF4CAF7D), Color(0xFF2E8C5D)],
    [Color(0xFFB58AE0), Color(0xFF7C5CBF)],
    [Color(0xFFE0879B), Color(0xFFB76E79)],
    [Color(0xFF5A42A0), Color(0xFF2E2360)],
  ];

  static const List<IconData> _iconVariants = [
    Icons.spa,
    Icons.content_cut,
    Icons.brush,
    Icons.palette,
    Icons.face_retouching_natural,
    Icons.local_florist,
  ];

  /// `String.hashCode` platformlar arası/oturumlar arası sabit değildir
  /// (dart2js farklı üretir). FNV-1a benzeri kendi hash'imiz: aynı id web'de
  /// ve mobilde her zaman aynı rengi verir.
  static int _stableSeed(String value) {
    var hash = 0x811c9dc5;
    for (final unit in value.codeUnits) {
      hash ^= unit & 0xff;
      hash = (hash * 0x01000193) & 0x7fffffff;
    }
    return hash;
  }

  static List<Color> paletteFor(String seed) {
    if (seed.isEmpty) return _variants.first;
    return _variants[_stableSeed(seed) % _variants.length];
  }

  static IconData iconFor(String seed) {
    if (seed.isEmpty) return Icons.spa;
    return _iconVariants[_stableSeed(seed) % _iconVariants.length];
  }

  const SalonPlaceholder({
    super.key,
    required this.seed,
    this.iconName = '',
    this.semanticsLabel = '',
    this.height,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    final colors = paletteFor(seed);
    final icon =
        iconName.isEmpty ? iconFor(seed) : categoryIcon(iconName);
    final radius = borderRadius ?? BorderRadius.zero;

    final art = DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: colors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          // köşe dekorasyonu — düz bloğun "eksik görsel" gibi durmasını kırar
          Positioned(
            right: -26,
            bottom: -30,
            child: Container(
              width: 96,
              height: 96,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.07),
              ),
            ),
          ),
          Center(
            child: Icon(icon, size: 40, color: Colors.white.withValues(alpha: 0.42)),
          ),
        ],
      ),
    );

    final clipped = ClipRRect(borderRadius: radius, child: art);

    return Semantics(
      image: true,
      label: semanticsLabel.isEmpty ? null : semanticsLabel,
      child: SizedBox(
        width: double.infinity,
        height: height,
        child: clipped,
      ),
    );
  }
}
