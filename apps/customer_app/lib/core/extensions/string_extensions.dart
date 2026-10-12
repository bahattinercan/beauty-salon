extension StringX on String {
  /// Returns initials from a full name (e.g. "Ahmet Yılmaz" → "AY").
  String get initials {
    final parts = trim().split(' ');
    if (parts.length >= 2) {
      return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
    }
    return isNotEmpty ? this[0].toUpperCase() : '?';
  }
}
