import 'package:freezed_annotation/freezed_annotation.dart';
import '../../domain/entities/user_profile.dart';

part 'user_profile_model.freezed.dart';
part 'user_profile_model.g.dart';

@freezed
sealed class UserProfileModel with _$UserProfileModel {
  const factory UserProfileModel({
    @JsonKey(defaultValue: '') required String id,
    @JsonKey(defaultValue: '') required String email,
    @JsonKey(defaultValue: '') required String fullName,
    String? phone,
    String? avatarUrl,
    @Default('CUSTOMER') String role,
  }) = _UserProfileModel;

  factory UserProfileModel.fromJson(Map<String, dynamic> json) =>
      _$UserProfileModelFromJson(json);
}

extension UserProfileModelX on UserProfileModel {
  UserProfile toEntity() => UserProfile(
        id: id,
        email: email,
        fullName: fullName,
        phone: phone,
        avatarUrl: avatarUrl,
        role: role,
      );
}
