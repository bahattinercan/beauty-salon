extension DateTimeX on DateTime {
  /// Turkish relative time: "Bugün", "3 gün önce", "2 hafta önce", "1 ay önce".
  String get timeAgoTr {
    final diff = DateTime.now().difference(this);
    if (diff.inDays >= 30) return '${(diff.inDays / 30).floor()} ay önce';
    if (diff.inDays >= 7) return '${(diff.inDays / 7).floor()} hafta önce';
    if (diff.inDays >= 1) return '${diff.inDays} gün önce';
    return 'Bugün';
  }

  /// Short relative time: "1y", "2mo", "5d", "3h", "10m".
  String get timeAgoShort {
    final diff = DateTime.now().difference(this);
    if (diff.inDays >= 365) return '${diff.inDays ~/ 365}y';
    if (diff.inDays >= 30) return '${diff.inDays ~/ 30}mo';
    if (diff.inDays >= 1) return '${diff.inDays}d';
    if (diff.inHours >= 1) return '${diff.inHours}h';
    return '${diff.inMinutes}m';
  }
}
