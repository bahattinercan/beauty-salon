# 13 · Yeni Özellik Ekleme Rehberi

## 13.1 Dosya Konvansiyonu

```
lib/features/<feature>/
  data/<feature>_provider.dart          # model + AsyncNotifier
  presentation/screens/<feature>_screen.dart
```

- Model ve provider **aynı dosyada** (mevcut konvansiyon).
- Kod üretimi (freezed/json_serializable/riverpod_generator) **yok** — elle yazılır.
- HTTP erişimi **her zaman** `ref.read(apiClientProvider).dio` üzerinden.

---

## 13.2 Provider Şablonu

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_provider.dart';
import '../../salon/data/salon_provider.dart';

class Thing {
  final String id;
  final String name;
  const Thing({required this.id, required this.name});

  factory Thing.fromJson(Map<String, dynamic> j) => Thing(
        id: j['id']?.toString() ?? '',
        name: j['name']?.toString() ?? '',
      );
}

final thingsProvider =
    AsyncNotifierProvider<ThingsNotifier, List<Thing>>(ThingsNotifier.new);

class ThingsNotifier extends AsyncNotifier<List<Thing>> {
  @override
  Future<List<Thing>> build() => _fetch();

  Future<List<Thing>> _fetch() async {
    final salon = await ref.watch(salonProvider.future);
    if (salon == null) return [];
    final res = await ref.read(apiClientProvider).dio.get('/salons/${salon.id}/things');
    return ((res.data['data'] as List?) ?? [])
        .map((e) => Thing.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetch);
  }

  Future<void> create(Map<String, dynamic> data) async {
    final salon = ref.read(salonProvider).asData?.value;
    if (salon == null) return;
    await ref.read(apiClientProvider).dio.post('/salons/${salon.id}/things', data: data);
    state = await AsyncValue.guard(_fetch);
  }
}
```

**Kurallar**
1. Salon ID için `salonProvider.future`'ı `await` et (senkron `ref.read` cold start'ta null döner).
2. Mutasyon sonrası tam yeniden fetch (`AsyncValue.guard`) — optimistic update yok.
3. Null-güvenli parsing: her alan `?.toString() ?? default`.

---

## 13.3 Ekran Şablonu

```dart
class ThingScreen extends ConsumerWidget {
  const ThingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = S.of(context);
    final c = context.colors;
    final things = ref.watch(thingsProvider);

    return Scaffold(
      appBar: AppBar(title: Text(s.thingsTitle)),
      body: AsyncStateView<List<Thing>>(
        value: things,
        skeleton: const SkeletonList(count: 4, itemHeight: 90),
        empty: EmptyState(message: s.noThingsYet, icon: Icons.add_circle_outline),
        isEmpty: (list) => list.isEmpty,
        onRetry: () => ref.read(thingsProvider.notifier).refresh(),
        data: (list) => ListView.builder(...),
      ),
      floatingActionButton: FloatingActionButton(...),
    );
  }
}
```

Hatalı mutasyon → `ScaffoldMessenger` + `AppColors.error` SnackBar.

---

## 13.4 Route + Navigasyon

`lib/app/router.dart` → `ShellRoute.routes` içine:
```dart
GoRoute(
  path: '/things',
  pageBuilder: (context, state) => const NoTransitionPage(child: ThingScreen()),
),
```
`SalonMainScaffold`: `_getCurrentIndex()` prefix + `_onTap()` index güncelle.

---

## 13.5 Çeviri

`core/l10n/app_strings.dart`'a TR/EN çiftini ekle:
```dart
String get thingsTitle   => isEn ? 'Things' : 'Şeyler';
String get noThingsYet   => isEn ? 'Nothing yet' : 'Henüz bir şey yok';
```
Hardcoded metin bırakma.

---

## 13.6 Görsel varsa

```dart
Image.network(resolveMediaUrl(url), errorBuilder: (_, _, _) => const Icon(Icons.broken_image_outlined));
```
`resolveMediaUrl` **mutlaka** kullanılmalı; API `/uploads/...` kök-göreli döner.

Upload:
```dart
final picked = await ImagePicker().pickMultiImage(limit: 5);
final urls = await UploadService(dio: ref.read(apiClientProvider).dio).uploadImages(picked);
```

---

## 13.7 Test

`test/features/<feature>/<feature>_provider_test.dart`:
```dart
final api = FakeApi(responses: {'/salons/salon-1/things': {'data': [...]}});
final container = makeContainer(api);
await settle(container, authProvider);
await settle(container, thingsProvider);

expect(container.read(thingsProvider).asData!.value.length, 2);
await container.read(thingsProvider.notifier).create({'name': 'X'});
expect(api.called('POST', '/salons/salon-1/things'), true);
```

Model testleri ayrıca `fromJson` edge case'lerini (null, eksik alan, string sayı) kilitlemeli.

---

## 13.8 Checklist

- [ ] Provider `salonProvider.future` kullanıyor
- [ ] `AsyncValue.guard` ile hata yakalama
- [ ] Ekran `AsyncStateView`/`SkeletonList`/`EmptyState`/`ErrorState` kullanıyor
- [ ] Tüm metinler `S.of(context)` üzerinden
- [ ] Görseller `resolveMediaUrl` ile
- [ ] Route + scaffold index güncellendi
- [ ] Model + provider testi yazıldı, `flutter test` geçiyor
- [ ] `flutter analyze` temiz
