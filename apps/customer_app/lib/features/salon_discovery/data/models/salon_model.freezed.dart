// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'salon_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$SalonModel {

@JsonKey(defaultValue: '') String get id;@JsonKey(defaultValue: '') String get name; String get address; String? get city; String? get district; double get ratingAvg; int get reviewCount; String? get logoUrl; String? get coverImageUrl; int get priceRange; double? get distance; double? get latitude; double? get longitude; String? get phone; DateTime? get createdAt;
/// Create a copy of SalonModel
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$SalonModelCopyWith<SalonModel> get copyWith => _$SalonModelCopyWithImpl<SalonModel>(this as SalonModel, _$identity);

  /// Serializes this SalonModel to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is SalonModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.address, address) || other.address == address)&&(identical(other.city, city) || other.city == city)&&(identical(other.district, district) || other.district == district)&&(identical(other.ratingAvg, ratingAvg) || other.ratingAvg == ratingAvg)&&(identical(other.reviewCount, reviewCount) || other.reviewCount == reviewCount)&&(identical(other.logoUrl, logoUrl) || other.logoUrl == logoUrl)&&(identical(other.coverImageUrl, coverImageUrl) || other.coverImageUrl == coverImageUrl)&&(identical(other.priceRange, priceRange) || other.priceRange == priceRange)&&(identical(other.distance, distance) || other.distance == distance)&&(identical(other.latitude, latitude) || other.latitude == latitude)&&(identical(other.longitude, longitude) || other.longitude == longitude)&&(identical(other.phone, phone) || other.phone == phone)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,address,city,district,ratingAvg,reviewCount,logoUrl,coverImageUrl,priceRange,distance,latitude,longitude,phone,createdAt);

@override
String toString() {
  return 'SalonModel(id: $id, name: $name, address: $address, city: $city, district: $district, ratingAvg: $ratingAvg, reviewCount: $reviewCount, logoUrl: $logoUrl, coverImageUrl: $coverImageUrl, priceRange: $priceRange, distance: $distance, latitude: $latitude, longitude: $longitude, phone: $phone, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class $SalonModelCopyWith<$Res>  {
  factory $SalonModelCopyWith(SalonModel value, $Res Function(SalonModel) _then) = _$SalonModelCopyWithImpl;
@useResult
$Res call({
@JsonKey(defaultValue: '') String id,@JsonKey(defaultValue: '') String name, String address, String? city, String? district, double ratingAvg, int reviewCount, String? logoUrl, String? coverImageUrl, int priceRange, double? distance, double? latitude, double? longitude, String? phone, DateTime? createdAt
});




}
/// @nodoc
class _$SalonModelCopyWithImpl<$Res>
    implements $SalonModelCopyWith<$Res> {
  _$SalonModelCopyWithImpl(this._self, this._then);

  final SalonModel _self;
  final $Res Function(SalonModel) _then;

/// Create a copy of SalonModel
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,Object? address = null,Object? city = freezed,Object? district = freezed,Object? ratingAvg = null,Object? reviewCount = null,Object? logoUrl = freezed,Object? coverImageUrl = freezed,Object? priceRange = null,Object? distance = freezed,Object? latitude = freezed,Object? longitude = freezed,Object? phone = freezed,Object? createdAt = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,address: null == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String,city: freezed == city ? _self.city : city // ignore: cast_nullable_to_non_nullable
as String?,district: freezed == district ? _self.district : district // ignore: cast_nullable_to_non_nullable
as String?,ratingAvg: null == ratingAvg ? _self.ratingAvg : ratingAvg // ignore: cast_nullable_to_non_nullable
as double,reviewCount: null == reviewCount ? _self.reviewCount : reviewCount // ignore: cast_nullable_to_non_nullable
as int,logoUrl: freezed == logoUrl ? _self.logoUrl : logoUrl // ignore: cast_nullable_to_non_nullable
as String?,coverImageUrl: freezed == coverImageUrl ? _self.coverImageUrl : coverImageUrl // ignore: cast_nullable_to_non_nullable
as String?,priceRange: null == priceRange ? _self.priceRange : priceRange // ignore: cast_nullable_to_non_nullable
as int,distance: freezed == distance ? _self.distance : distance // ignore: cast_nullable_to_non_nullable
as double?,latitude: freezed == latitude ? _self.latitude : latitude // ignore: cast_nullable_to_non_nullable
as double?,longitude: freezed == longitude ? _self.longitude : longitude // ignore: cast_nullable_to_non_nullable
as double?,phone: freezed == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}

}


/// Adds pattern-matching-related methods to [SalonModel].
extension SalonModelPatterns on SalonModel {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _SalonModel value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _SalonModel() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _SalonModel value)  $default,){
final _that = this;
switch (_that) {
case _SalonModel():
return $default(_that);}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _SalonModel value)?  $default,){
final _that = this;
switch (_that) {
case _SalonModel() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@JsonKey(defaultValue: '')  String id, @JsonKey(defaultValue: '')  String name,  String address,  String? city,  String? district,  double ratingAvg,  int reviewCount,  String? logoUrl,  String? coverImageUrl,  int priceRange,  double? distance,  double? latitude,  double? longitude,  String? phone,  DateTime? createdAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _SalonModel() when $default != null:
return $default(_that.id,_that.name,_that.address,_that.city,_that.district,_that.ratingAvg,_that.reviewCount,_that.logoUrl,_that.coverImageUrl,_that.priceRange,_that.distance,_that.latitude,_that.longitude,_that.phone,_that.createdAt);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@JsonKey(defaultValue: '')  String id, @JsonKey(defaultValue: '')  String name,  String address,  String? city,  String? district,  double ratingAvg,  int reviewCount,  String? logoUrl,  String? coverImageUrl,  int priceRange,  double? distance,  double? latitude,  double? longitude,  String? phone,  DateTime? createdAt)  $default,) {final _that = this;
switch (_that) {
case _SalonModel():
return $default(_that.id,_that.name,_that.address,_that.city,_that.district,_that.ratingAvg,_that.reviewCount,_that.logoUrl,_that.coverImageUrl,_that.priceRange,_that.distance,_that.latitude,_that.longitude,_that.phone,_that.createdAt);}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@JsonKey(defaultValue: '')  String id, @JsonKey(defaultValue: '')  String name,  String address,  String? city,  String? district,  double ratingAvg,  int reviewCount,  String? logoUrl,  String? coverImageUrl,  int priceRange,  double? distance,  double? latitude,  double? longitude,  String? phone,  DateTime? createdAt)?  $default,) {final _that = this;
switch (_that) {
case _SalonModel() when $default != null:
return $default(_that.id,_that.name,_that.address,_that.city,_that.district,_that.ratingAvg,_that.reviewCount,_that.logoUrl,_that.coverImageUrl,_that.priceRange,_that.distance,_that.latitude,_that.longitude,_that.phone,_that.createdAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _SalonModel implements SalonModel {
  const _SalonModel({@JsonKey(defaultValue: '') required this.id, @JsonKey(defaultValue: '') required this.name, this.address = '', this.city, this.district, this.ratingAvg = 0.0, this.reviewCount = 0, this.logoUrl, this.coverImageUrl, this.priceRange = 0, this.distance, this.latitude, this.longitude, this.phone, this.createdAt});
  factory _SalonModel.fromJson(Map<String, dynamic> json) => _$SalonModelFromJson(json);

@override@JsonKey(defaultValue: '') final  String id;
@override@JsonKey(defaultValue: '') final  String name;
@override@JsonKey() final  String address;
@override final  String? city;
@override final  String? district;
@override@JsonKey() final  double ratingAvg;
@override@JsonKey() final  int reviewCount;
@override final  String? logoUrl;
@override final  String? coverImageUrl;
@override@JsonKey() final  int priceRange;
@override final  double? distance;
@override final  double? latitude;
@override final  double? longitude;
@override final  String? phone;
@override final  DateTime? createdAt;

/// Create a copy of SalonModel
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$SalonModelCopyWith<_SalonModel> get copyWith => __$SalonModelCopyWithImpl<_SalonModel>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$SalonModelToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _SalonModel&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.address, address) || other.address == address)&&(identical(other.city, city) || other.city == city)&&(identical(other.district, district) || other.district == district)&&(identical(other.ratingAvg, ratingAvg) || other.ratingAvg == ratingAvg)&&(identical(other.reviewCount, reviewCount) || other.reviewCount == reviewCount)&&(identical(other.logoUrl, logoUrl) || other.logoUrl == logoUrl)&&(identical(other.coverImageUrl, coverImageUrl) || other.coverImageUrl == coverImageUrl)&&(identical(other.priceRange, priceRange) || other.priceRange == priceRange)&&(identical(other.distance, distance) || other.distance == distance)&&(identical(other.latitude, latitude) || other.latitude == latitude)&&(identical(other.longitude, longitude) || other.longitude == longitude)&&(identical(other.phone, phone) || other.phone == phone)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,address,city,district,ratingAvg,reviewCount,logoUrl,coverImageUrl,priceRange,distance,latitude,longitude,phone,createdAt);

@override
String toString() {
  return 'SalonModel(id: $id, name: $name, address: $address, city: $city, district: $district, ratingAvg: $ratingAvg, reviewCount: $reviewCount, logoUrl: $logoUrl, coverImageUrl: $coverImageUrl, priceRange: $priceRange, distance: $distance, latitude: $latitude, longitude: $longitude, phone: $phone, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class _$SalonModelCopyWith<$Res> implements $SalonModelCopyWith<$Res> {
  factory _$SalonModelCopyWith(_SalonModel value, $Res Function(_SalonModel) _then) = __$SalonModelCopyWithImpl;
@override @useResult
$Res call({
@JsonKey(defaultValue: '') String id,@JsonKey(defaultValue: '') String name, String address, String? city, String? district, double ratingAvg, int reviewCount, String? logoUrl, String? coverImageUrl, int priceRange, double? distance, double? latitude, double? longitude, String? phone, DateTime? createdAt
});




}
/// @nodoc
class __$SalonModelCopyWithImpl<$Res>
    implements _$SalonModelCopyWith<$Res> {
  __$SalonModelCopyWithImpl(this._self, this._then);

  final _SalonModel _self;
  final $Res Function(_SalonModel) _then;

/// Create a copy of SalonModel
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,Object? address = null,Object? city = freezed,Object? district = freezed,Object? ratingAvg = null,Object? reviewCount = null,Object? logoUrl = freezed,Object? coverImageUrl = freezed,Object? priceRange = null,Object? distance = freezed,Object? latitude = freezed,Object? longitude = freezed,Object? phone = freezed,Object? createdAt = freezed,}) {
  return _then(_SalonModel(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,address: null == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String,city: freezed == city ? _self.city : city // ignore: cast_nullable_to_non_nullable
as String?,district: freezed == district ? _self.district : district // ignore: cast_nullable_to_non_nullable
as String?,ratingAvg: null == ratingAvg ? _self.ratingAvg : ratingAvg // ignore: cast_nullable_to_non_nullable
as double,reviewCount: null == reviewCount ? _self.reviewCount : reviewCount // ignore: cast_nullable_to_non_nullable
as int,logoUrl: freezed == logoUrl ? _self.logoUrl : logoUrl // ignore: cast_nullable_to_non_nullable
as String?,coverImageUrl: freezed == coverImageUrl ? _self.coverImageUrl : coverImageUrl // ignore: cast_nullable_to_non_nullable
as String?,priceRange: null == priceRange ? _self.priceRange : priceRange // ignore: cast_nullable_to_non_nullable
as int,distance: freezed == distance ? _self.distance : distance // ignore: cast_nullable_to_non_nullable
as double?,latitude: freezed == latitude ? _self.latitude : latitude // ignore: cast_nullable_to_non_nullable
as double?,longitude: freezed == longitude ? _self.longitude : longitude // ignore: cast_nullable_to_non_nullable
as double?,phone: freezed == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as DateTime?,
  ));
}


}

// dart format on
