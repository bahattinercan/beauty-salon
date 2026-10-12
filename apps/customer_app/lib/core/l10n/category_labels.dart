import 'app_strings.dart';

/// Backend'deki Türkçe kategori adını çeviriye eşler.
/// Bilinmeyen ad olduğu gibi döner (DB'de admin yeni kategori ekleyebilir).
String categoryLabel(S s, String name) {
  switch (name) {
    case 'Saç':
      return s.catHair;
    case 'Tırnak':
      return s.catNail;
    case 'Cilt Bakımı':
      return s.catSkin;
    case 'Makyaj':
      return s.catMakeup;
    case 'Epilasyon':
      return s.catEpilation;
    case 'SPA & Masaj':
      return s.catSpa;
    default:
      return name;
  }
}
