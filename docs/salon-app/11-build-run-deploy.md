# 11 · Kurulum, Çalıştırma, Dağıtım

## 11.1 Ön Koşullar

- Flutter SDK (repo 3.44.3 ile doğrulandı), Dart ≥ 3.10
- Backend: `apps/api` (Node.js) — varsayılan port **3000**
- Android emulator (Android için) veya Chrome (web için)

---

## 11.2 Backend'i Ayağa Kaldırma

```bash
cd apps/api
npm install
npm run dev          # http://localhost:3000/api/v1
```

Test kullanıcıları (e-posta listesi) için `apps/api/src/seeders/seed.js` ->
`USERS` bölümüne bakın; şifreler repoda tutulmaz.

---

## 11.3 Uygulamayı Çalıştırma

```bash
cd apps/salon_app
flutter pub get
flutter run                       # bağlı cihaz/emülatör
flutter run -d chrome             # web
flutter run -d windows|linux|macos
```

### Ortam override'ları (dart-define)

| Define | Etki |
|---|---|
| `API_BASE_URL` | Base URL'i tamamen değiştirir (en yüksek öncelik) |
| `MEDIA_BASE_URL` | Medya origin'ini değiştirir (uploads için) |

```bash
# API farklı portta ise (ör. test harness 3200 kullanıyor)
flutter run --dart-define=API_BASE_URL=http://localhost:3200/api/v1

# Gerçek üretim API'si
flutter run --dart-define=API_BASE_URL=https://api.example.com/api/v1
```

**Emülatör notu:** Debug modda base URL `http://10.0.2.2:3000/api/v1`'dir. Emülatörde host makinesine erişmek için `localhost` **çalışmaz**; `10.0.2.2` gerekir. Web'te ise `http://localhost:3000/api/v1` kullanılır.

---

## 11.4 Build Komutları

```bash
flutter build apk --release                 # Android
flutter build ios --release                 # iOS
flutter build web                           # web (build/web)
flutter build exe --release                 # Windows
```

`pubspec.yaml` → `version: 1.0.0+1` (Android versionName/versionCode, iOS CFBundleShortVersionString/CFBundleVersion).

---

## 11.5 Platform Notları

| Platform | Not |
|---|---|
| **Android** | `com.beautysalon.salon_app`, Gradle 8.14, Kotlin `MainActivity`. Ekstra izin yok. `flutter_secure_storage` keystore kullanır. |
| **iOS** | Standart Runner + Podfile; `flutter_secure_storage` keychain. |
| **Web** | `web/index.html`, `manifest.json` (name: salon_app), favicon/icon setleri. Deep link için `Uri.base.path` okunur (bkz. [03-routing-navigation.md](03-routing-navigation.md)). |
| **Masaüstü** | Windows/Linux/macOS runner'ları mevcut; API `localhost:3000` varsayımı debug'da `10.0.2.2` olduğu için masaüstünde `--dart-define` gerekebilir. |

---

## 11.6 Üretim İçin Yapılacaklar

1. `ApiEnvironment.baseUrl` içindeki `https://api.salonyonetimi.com/api/v1` placeholder'ı gerçek domain ile değiştirilmeli **vey** deploy sırasında `--dart-define=API_BASE_URL=...` verilmeli.
2. HTTPS zorunlu (secure storage + JWT).
3. `web/manifest.json` name/theme_color güncellenmeli (şu an Flutter default `#0175C2`).
4. Android `android:label="salon_app"` → kullanıcıya görünen isim ("Salon Yönetimi") yapılmalı.
5. Rate limit (100/dk) göz önüne alınmalı; dashboard tek istekte geliyor ama sayfa başına ekstra refresh'ler limit yaratabilir.
