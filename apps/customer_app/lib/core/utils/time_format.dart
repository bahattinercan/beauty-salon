/// Pure helper fonksiyonlar (Flutter/Dio importu yok) — CLAUDE.md §2.
String formatDuration(int minutes) {
  if (minutes < 60) return '$minutes dk';
  final h = minutes ~/ 60;
  final m = minutes % 60;
  return m == 0 ? '$h sa' : '$h sa $m dk';
}

String addMinutes(String time, int minutes) {
  final p = time.split(':');
  final total = int.parse(p[0]) * 60 + int.parse(p[1]) + minutes;
  return '${(total ~/ 60).toString().padLeft(2, '0')}:${(total % 60).toString().padLeft(2, '0')}';
}
