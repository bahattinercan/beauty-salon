import 'package:freezed_annotation/freezed_annotation.dart';
import '../../domain/entities/user.dart';

part 'user_model.freezed.dart';
part 'user_model.g.dart';

@freezed
sealed class UserModel with _$UserModel {
  const factory UserModel({
    @JsonKey(defaultValue: '') required String id,
    @JsonKey(defaultValue: '') required String email,
    @JsonKey(defaultValue: '') required String fullName,
    String? phone,
    String? avatarUrl,
    @Default('CUSTOMER') String role,
  }) = _UserModel;

  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);
}

extension UserModelX on UserModel {
  User toEntity() => User(
        id: id,
        email: email,
        fullName: fullName,
        phone: phone,
        avatarUrl: avatarUrl,
        role: role,
      );
}
