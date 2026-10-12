/// `GET /categories` (ServiceCategory) karşılığı. Saf Dart.
class ServiceCategory {
  final String id;
  final String name;
  final String iconName;
  final int sortOrder;

  const ServiceCategory({
    required this.id,
    required this.name,
    this.iconName = '',
    this.sortOrder = 0,
  });
}
