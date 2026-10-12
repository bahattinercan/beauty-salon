import 'package:flutter/material.dart';

/// Kategori adı veya `ServiceCategory.iconName` → Material ikonu.
IconData categoryIcon(String name) {
  switch (name) {
    case 'content_cut':
    case 'Saç':
      return Icons.content_cut;
    case 'brush':
    case 'Tırnak':
      return Icons.brush;
    case 'face':
    case 'Cilt Bakımı':
      return Icons.face;
    case 'palette':
    case 'Makyaj':
      return Icons.palette;
    case 'self_improvement':
    case 'SPA & Masaj':
      return Icons.self_improvement;
    case 'spa':
    case 'Epilasyon':
      return Icons.spa;
    default:
      return Icons.category_outlined;
  }
}
