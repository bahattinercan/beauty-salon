import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/app_theme.dart';

/// `bannerGradient` yüzeyini durum çubuğunun altına gömen ekranlar için
/// sarmalayıcı: o bölgede sistem ikonları beyaz olur.
///
/// Neden gerekli: `AppTheme.overlayFor` tema geneli koyu ikon veriyor (light
/// temada açık zemin), ama login/kayıt/home başlıkları ekranın tepesine mor
/// gradyanı taşır. Mor üstünde koyu ikon ~3:1 kalıyordu (cihazda ölçüldü).
class BrandSurface extends StatelessWidget {
  const BrandSurface({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) => AnnotatedRegion<SystemUiOverlayStyle>(
        value: AppTheme.onBrandSurface,
        child: child,
      );
}
