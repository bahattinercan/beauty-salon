import '../../app/environment.dart';

/// API, yüklenen dosyalar için kök-göreli yol döner (örn. `/uploads/abc.jpg`,
/// bkz. API `upload.controller.js`). Bu dosyalar API origin'inde `/api/v1`
/// öneki olmadan statik servis edilir; `Image.network`/`CachedNetworkImage` ise
/// mutlak URL bekler. Bu fonksiyon yolu tamamlar ve mutlak URL'leri olduğu gibi
/// bırakır (idempotenttir).
String resolveMediaUrl(String? url) {
  final value = url?.trim() ?? '';
  if (value.isEmpty) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;

  final origin = ApiEnvironment.mediaUrl;
  return value.startsWith('/') ? '$origin$value' : '$origin/$value';
}
