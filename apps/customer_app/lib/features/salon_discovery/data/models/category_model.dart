import '../../domain/entities/service_category.dart';

/// `GET /categories` DTO (ServiceCategory satırı).
class CategoryModel {
  final String id;
  final String name;
  final String iconName;
  final int sortOrder;

  const CategoryModel({
    required this.id,
    required this.name,
    this.iconName = '',
    this.sortOrder = 0,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) => CategoryModel(
        id: json['id'] as String,
        name: json['name'] as String? ?? '',
        iconName: (json['iconName'] ?? json['icon_name']) as String? ?? '',
        sortOrder: (json['sortOrder'] ?? json['sort_order']) as int? ?? 0,
      );

  ServiceCategory toEntity() => ServiceCategory(
        id: id,
        name: name,
        iconName: iconName,
        sortOrder: sortOrder,
      );
}
