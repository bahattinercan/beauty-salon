import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest_all.dart' as tz;

class NotificationService {
  static final _plugin = FlutterLocalNotificationsPlugin();

  static const _channelId = 'appointments_reminder';
  static const _channelName = 'Randevu Hatırlatıcısı';

  static Future<void> init() async {
    tz.initializeTimeZones();
    tz.setLocalLocation(tz.getLocation('Europe/Istanbul'));

    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    // iOS izinleri init'te istenmez (aşağıda ensurePermissions).
    const iosSettings = DarwinInitializationSettings();
    const settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );
    await _plugin.initialize(settings);
  }

  /// Bildirim izinleri UYGULAMA AÇILIŞINDA değil, hatırlatma gerçekten
  /// planlanırken istenir. Cihazda ölçülen sorun: `main()` içindeki `init()`
  /// daha ürün görünmeden Android bildirim + tam alarm dialoglarını
  /// açıyordu (kullanıcı bağlamsız iki izin sorusu görüyordu).
  static Future<void> ensurePermissions() async {
    await _plugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.requestNotificationsPermission();

    await _plugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.requestExactAlarmsPermission();

    await _plugin
        .resolvePlatformSpecificImplementation<
            IOSFlutterLocalNotificationsPlugin>()
        ?.requestPermissions(alert: true, badge: true, sound: true);
  }

  static Future<void> scheduleAppointmentReminder({
    required String appointmentId,
    required String salonName,
    required String serviceName,
    required DateTime appointmentDateTime,
  }) async {
    final reminderTime = appointmentDateTime.subtract(const Duration(hours: 1));
    if (reminderTime.isBefore(DateTime.now())) return;

    // İzinler tam bu noktada sorulur: kullanıcı az önce randevusunu onayladı,
    // "neden soruyorsun" bağlamı ortada.
    await ensurePermissions();

    const details = NotificationDetails(
      android: AndroidNotificationDetails(
        _channelId,
        _channelName,
        importance: Importance.high,
        priority: Priority.high,
      ),
      iOS: DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
      ),
    );

    await _plugin.zonedSchedule(
      appointmentId.hashCode.abs(),
      'Randevunuz yaklaşıyor',
      '$salonName — $serviceName randevunuz 1 saat sonra!',
      tz.TZDateTime.from(reminderTime, tz.local),
      details,
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
    );
  }

  static Future<void> cancelReminder(String appointmentId) async {
    await _plugin.cancel(appointmentId.hashCode.abs());
  }
}
