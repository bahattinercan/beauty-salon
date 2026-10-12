import 'package:flutter_test/flutter_test.dart';
import 'package:salon_app/features/staff/data/staff_provider.dart';

void main() {
  group('StaffMember.fromJson', () {
    test('services listesi name ve id olarak ayrıştırılır', () {
      final s = StaffMember.fromJson({
        'id': 'st1',
        'fullName': 'Merve Demir',
        'title': 'Kuaför',
        'phone': '+905550001122',
        'email': 'merve@salon.com',
        'isActive': true,
        'services': [
          {'id': 'sv1', 'name': 'Saç Kesimi'},
          {'id': 'sv2', 'name': 'Cilt Bakımı'},
        ],
        'ratingAvg': 4.5,
      });

      expect(s.serviceIds, ['sv1', 'sv2']);
      expect(s.serviceNames, ['Saç Kesimi', 'Cilt Bakımı']);
      expect(s.ratingAvg, 4.5);
      expect(s.isActive, true);
    });

    test('services yoksa boş liste, ratingAvg yoksa null', () {
      final s = StaffMember.fromJson({'id': 'st2', 'fullName': 'Ali'});

      expect(s.serviceNames, isEmpty);
      expect(s.serviceIds, isEmpty);
      expect(s.ratingAvg, isNull);
      // Model default: isActive true
      expect(s.isActive, true);
    });

    test('isActive açıkça false ise true olmaz', () {
      final s = StaffMember.fromJson({'id': 'st3', 'fullName': 'Zeynep', 'isActive': false});
      expect(s.isActive, false);
    });
  });
}
