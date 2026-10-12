import '../../../../core/extensions/string_extensions.dart';

class UserProfile {
  final String id;
  final String email;
  final String fullName;
  final String? phone;
  final String? avatarUrl;
  final String role;

  const UserProfile({
    required this.id,
    required this.email,
    required this.fullName,
    this.phone,
    this.avatarUrl,
    required this.role,
  });

  String get initials => fullName.initials;

  UserProfile copyWith({
    String? fullName,
    String? phone,
    String? avatarUrl,
  }) =>
      UserProfile(
        id: id,
        email: email,
        fullName: fullName ?? this.fullName,
        phone: phone ?? this.phone,
        avatarUrl: avatarUrl ?? this.avatarUrl,
        role: role,
      );
}
