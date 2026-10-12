import 'package:fpdart/fpdart.dart';
import '../../../../core/error/failures.dart';
import '../entities/notification_page.dart';

abstract class NotificationRepository {
  Future<Either<Failure, NotificationPage>> getNotifications({
    int page,
    int limit,
    bool? isRead,
  });

  Future<Either<Failure, int>> getUnreadCount();
  Future<Either<Failure, Unit>> markAsRead(String id);
  Future<Either<Failure, Unit>> markAllAsRead();
}
