import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppTheme {
  AppTheme._();

  // ── LX-002 (CA-024) çevrimdışı font fallback ────────────────────────────
  // google_fonts fontu ilk kullanımda runtime'da indirir; ağ yoksa Flutter
  // `fontFamily` bulunamayınca sistemin son çare (tofu/blank) çizimine düşer.
  // Asset bundle'a font gömmeden (pubspec'e asset eklemek bu görevin dışında)
  // çözüm: her stile platformun hazır fontlarından oluşan bir yedek zinciri
  // vermek. Serif ve sans ayrı zincir taşır, çünkü LX-001 rolleri ayrı.
  static const List<String> serifFallback = ['Georgia', 'Times New Roman', 'serif'];
  static const List<String> sansFallback = ['Roboto', 'Helvetica', 'sans-serif'];

  /// Tema başına TAM sistem çubuğu stili.
  ///
  /// Cihazda ölçülen kusur: eskiden yalnızca `appBarTheme.systemOverlayStyle`
  /// içinde `statusBarColor: transparent` vardı; o stil sadece AppBar'ı olan
  /// ekranlarda uygulanıyor. Login/home `CustomScrollView` kullandığı için
  /// hiçbir şey uygulanmıyordu → mor hero'nun üstünde KAYU durum ikonları
  /// (~3:1) ve altta siyah gezinme çubuğu.
  static SystemUiOverlayStyle overlayFor(Brightness brightness) {
    final dark = brightness == Brightness.dark;
    return SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: dark ? Brightness.light : Brightness.dark,
      statusBarBrightness: dark ? Brightness.dark : Brightness.light,
      systemNavigationBarColor: Colors.transparent,
      systemNavigationBarIconBrightness: dark ? Brightness.light : Brightness.dark,
      systemNavigationBarDividerColor: Colors.transparent,
    );
  }

  /// Marka yüzeyi (`bannerGradient` başlık) durum çubuğunun altına girdiğinde
  /// ikonlar beyaz olmalı; tema rengiyle (light temada koyu ikon) mor üstünde
  /// kontrast AA altına düşüyordu. `BrandSurface` bu değeri kullanır.
  static const SystemUiOverlayStyle onBrandSurface = SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    statusBarBrightness: Brightness.dark,
    systemNavigationBarColor: Colors.transparent,
    systemNavigationBarIconBrightness: Brightness.dark,
    systemNavigationBarDividerColor: Colors.transparent,
  );

  // ── LX-001 tipografi (CA-022) ──────────────────────────────────────────
  // Fraunces YALNIZCA display + başlık ailesidir: yüksek kontrastlı serif
  // editorial başlık dokusu verir, ama uzun gövde metninde yorucudur. Bu yüzden
  // gövde/etiket metni Nunito'da kalır (body 1.55 satır yüksekliği, labelSmall
  // 0.16em tracking okunabilirliği taşır). Rol ayrımı tek yerde: burası.
  static TextTheme _luxTextTheme(TextTheme nunito) {
    // LX-002: Nunito gövde/etiket ailesinin yedek zinciri tek noktadan
    // `TextTheme.apply` ile tüm stillere yayılır. Serif stiller aşağıda kendi
    // zincirini yazar, çünkü gövdede serif yedeği yanlış olurdu.
    final sans = nunito.apply(fontFamilyFallback: sansFallback);

    // -0.01em: em = punto olduğu için tracking punto ile çarpılır. 1.15 satır
    // yüksekliği başlıklarda sıkı, "gazete künyesi" hissini verir.
    TextStyle serif(TextStyle? base, FontWeight weight) {
      final size = base?.fontSize ?? 24;
      // google_fonts 6.x: `GoogleFonts.fraunces(...)` imzasında fallback
      // parametresi YOK; dönen stilde fontFamilyFallback'i kendisi
      // `['Fraunces']` yapıyor. Bu yüzden yedek zincir ancak `copyWith` ile
      // eklenebiliyor (parametre geçmek sessizce yok sayılırdı).
      return GoogleFonts.fraunces(
        fontSize: size,
        fontWeight: weight,
        letterSpacing: -0.01 * size,
        height: 1.15,
      ).copyWith(fontFamilyFallback: serifFallback);
    }

    // titleMedium/titleSmall/labelLarge/labelMedium dokunulmaz: Nunito ve
    // mevcut ağırlıkları LX-001 ile değişmedi.
    return sans.copyWith(
      displayLarge: serif(sans.displayLarge, FontWeight.w400),
      displayMedium: serif(sans.displayMedium, FontWeight.w400),
      displaySmall: serif(sans.displaySmall, FontWeight.w500),
      headlineLarge: serif(sans.headlineLarge, FontWeight.w600),
      headlineMedium: serif(sans.headlineMedium, FontWeight.w600),
      headlineSmall: serif(sans.headlineSmall, FontWeight.w500),
      titleLarge: serif(sans.titleLarge, FontWeight.w600),
      // Gövde: Nunito + 1.55 satır yüksekliği (kart içi çok satırlı metin).
      bodyLarge: sans.bodyLarge?.copyWith(height: 1.55),
      bodyMedium: sans.bodyMedium?.copyWith(height: 1.55),
      bodySmall: sans.bodySmall?.copyWith(height: 1.55),
      // Etiket: labelSmall 0.16em tracking + w600 (rozet / üst başlık).
      labelSmall: sans.labelSmall?.copyWith(
        fontWeight: FontWeight.w600,
        letterSpacing: 0.16 * (sans.labelSmall?.fontSize ?? 11),
      ),
    );
  }

  static ThemeData get lightTheme {
    const c = AppColors.light;
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      textTheme: _luxTextTheme(GoogleFonts.nunitoTextTheme()),

      colorScheme: ColorScheme.light(
        primary: c.primary,
        onPrimary: c.onPrimary,
        secondary: c.secondary,
        onSecondary: c.textPrimary,
        surface: c.surface,
        onSurface: c.textPrimary,
        error: c.error,
        onError: Colors.white,
      ),

      scaffoldBackgroundColor: c.background,

      appBarTheme: AppBarTheme(
        elevation: 0,
        centerTitle: true,
        backgroundColor: c.surface,
        foregroundColor: c.textPrimary,
        systemOverlayStyle: overlayFor(Brightness.light),
        titleTextStyle: GoogleFonts.fraunces(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: c.textPrimary,
          letterSpacing: -0.01,
        ).copyWith(fontFamilyFallback: serifFallback),
      ),

      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        type: BottomNavigationBarType.fixed,
        backgroundColor: c.surface,
        selectedItemColor: c.primary,
        unselectedItemColor: c.textHint,
        selectedLabelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
        unselectedLabelStyle: const TextStyle(fontSize: 12),
        elevation: 12,
      ),

      // LX-001 "luxury editorial" radius: keskin köşe + hairline. Kart 2px,
      // buton 4px, input 2px, sheet 8px — yuvarlak "app" dilini bırakıp baskı
      // düzenine yaklaşır; yüzey ayrımını 1px `divider` taşır. Alt gezinme hapı
      // (widget tarafında, 999) bilinçli istisnadır: hap formu korunur.
      cardTheme: CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(2)),
        color: c.surface,
        shadowColor: c.primary.withValues(alpha: 0.08),
      ),

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: c.primary,
          foregroundColor: c.onPrimary,
          elevation: 0,
          minimumSize: const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.02,
            fontFamilyFallback: sansFallback,
          ),
        ),
      ),

      // CA-019: lime CTA tek noktadan — lime dolgusu ÜZERİNDE daima koyu metin.
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: c.accentLime,
          foregroundColor: c.onAccentLime,
          elevation: 0,
          minimumSize: const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.02,
            fontFamilyFallback: sansFallback,
          ),
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: c.primary,
          minimumSize: const Size(double.infinity, 52),
          side: BorderSide(color: c.primary),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.02,
            fontFamilyFallback: sansFallback,
          ),
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: c.primary,
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            fontFamilyFallback: sansFallback,
          ),
        ),
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: c.surfaceVariant,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(2),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(2),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(2),
          borderSide: BorderSide(color: c.primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(2),
          borderSide: BorderSide(color: c.error),
        ),
        hintStyle: TextStyle(color: c.textHint, fontSize: 14),
        labelStyle: TextStyle(color: c.textSecondary, fontSize: 14),
      ),

      chipTheme: ChipThemeData(
        backgroundColor: c.secondary,
        selectedColor: c.primary,
        labelStyle: TextStyle(fontSize: 13, color: c.textPrimary),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
      ),

      // Switch light temada temanın rengini kullanmıyordu (siyah outline/thumb).
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected) ? Colors.white : c.textHint,
        ),
        trackColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected) ? c.primary : c.surfaceVariant,
        ),
        trackOutlineColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected) ? Colors.transparent : c.textHint,
        ),
      ),

      dividerTheme: DividerThemeData(color: c.divider, thickness: 1),

      dialogTheme: DialogThemeData(
        backgroundColor: c.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
      ),

      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: c.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }

  static ThemeData get darkTheme {
    const c = AppColors.dark;
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      textTheme: _luxTextTheme(
          GoogleFonts.nunitoTextTheme(ThemeData.dark().textTheme)),

      colorScheme: ColorScheme.dark(
        primary: c.primary,
        onPrimary: c.onPrimary,
        secondary: c.secondary,
        onSecondary: c.textPrimary,
        surface: c.surface,
        onSurface: c.textPrimary,
        error: c.error,
        onError: Colors.white,
      ),

      scaffoldBackgroundColor: c.background,

      appBarTheme: AppBarTheme(
        elevation: 0,
        centerTitle: true,
        backgroundColor: c.surface,
        foregroundColor: c.textPrimary,
        systemOverlayStyle: overlayFor(Brightness.dark),
        titleTextStyle: GoogleFonts.fraunces(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: c.textPrimary,
          letterSpacing: -0.01,
        ).copyWith(fontFamilyFallback: serifFallback),
      ),

      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        type: BottomNavigationBarType.fixed,
        backgroundColor: c.surface,
        selectedItemColor: c.primary,
        unselectedItemColor: c.textHint,
        selectedLabelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
        unselectedLabelStyle: const TextStyle(fontSize: 12),
        elevation: 12,
      ),

      // LX-001 "luxury editorial" radius: keskin köşe + hairline. Kart 2px,
      // buton 4px, input 2px, sheet 8px — yuvarlak "app" dilini bırakıp baskı
      // düzenine yaklaşır; yüzey ayrımını 1px `divider` taşır. Alt gezinme hapı
      // (widget tarafında, 999) bilinçli istisnadır: hap formu korunur.
      cardTheme: CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(2)),
        color: c.surface,
        shadowColor: c.primary.withValues(alpha: 0.12),
      ),

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: c.primary,
          foregroundColor: c.onPrimary,
          elevation: 0,
          minimumSize: const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.02,
            fontFamilyFallback: sansFallback,
          ),
        ),
      ),

      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: c.accentLime,
          foregroundColor: c.onAccentLime,
          elevation: 0,
          minimumSize: const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.02,
            fontFamilyFallback: sansFallback,
          ),
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: c.primary,
          minimumSize: const Size(double.infinity, 52),
          side: BorderSide(color: c.primary),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.02,
            fontFamilyFallback: sansFallback,
          ),
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: c.primary,
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            fontFamilyFallback: sansFallback,
          ),
        ),
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: c.surfaceVariant,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(2),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(2),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(2),
          borderSide: BorderSide(color: c.primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(2),
          borderSide: BorderSide(color: c.error),
        ),
        hintStyle: TextStyle(color: c.textHint, fontSize: 14),
        labelStyle: TextStyle(color: c.textSecondary, fontSize: 14),
      ),

      chipTheme: ChipThemeData(
        backgroundColor: c.secondary,
        selectedColor: c.primary,
        labelStyle: TextStyle(fontSize: 13, color: c.textPrimary),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
      ),

      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected) ? Colors.white : c.textHint,
        ),
        trackColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected) ? c.primary : c.surfaceVariant,
        ),
        trackOutlineColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected) ? Colors.transparent : c.textHint,
        ),
      ),

      dividerTheme: DividerThemeData(color: c.divider, thickness: 1),

      dialogTheme: DialogThemeData(
        backgroundColor: c.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
      ),

      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: c.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }
}
