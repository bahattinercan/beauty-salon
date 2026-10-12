# CA-017 — 200 Satır Limiti Aşan Widget'ların Bölünmesi

**Öncelik:** 🟢 Düşük (teknik borç)
**Durum:** ✅ Uygulandı (2026-07-27) — tüm ekran/widget dosyaları ≤200 satır; analyze temiz, 97 test geçiyor
**Kapsam:** `apps/customer_app/lib/features/*/presentation/widgets/`
**Kural:** CLAUDE.md §10 — screen 200 satırı aşarsa sub-widget `presentation/widgets/`'e çıkarılır

---

## Özet

16 dosya 200 satır üzerinde. Bunlar çalışıyor ama "god widget" durumunda: layout + state + navigasyon + logic aynı `build()`'te. Aşağıdaki sırayla bölünmeli (satır sayısı büyük olan önce).

> `app_strings.dart` (314), `injection.config.dart` (254, generated), `app_theme.dart` (254), `salon_detail_model.dart` (228) widget olmadığı için kapsam dışı.

---

## Bölünecek Dosyalar

### 1. `booking_screen.dart` (775) → hedef ≤ 200

Çıkarılacak `features/booking/presentation/widgets/`:

| Yeni dosya | Şimdiki | Satır |
|------------|---------|-------|
| `step_indicator.dart` | `_buildStepIndicator` | 207-249 |
| `service_step.dart` | `_buildServiceStep` + `_buildServiceBar` | 250-352 |
| `staff_step.dart` | `_buildStaffStep` + `_staffOption` | 353-436 |
| `date_time_step.dart` | `_buildDateTimeStep` (+ slot chip) | 437-570 |
| `confirm_step.dart` | `_buildConfirmStep` + `_confirmRow` | 571-643 |
| `bottom_buttons.dart` | `_buildBottomButtons` | 644-775 |

Ek iş (CA-018 ile bağlı): `_availableSlots`, `_submitError`, `_loadingSlots` State'te duruyor → `BookingNotifier extends AsyncNotifier<BookingState>`'a taşınmalı (CLAUDE.md §5: server data State'te tutulmaz).

State önerisi:
```dart
class BookingState {
  final int step;
  final int? serviceIndex, staffIndex;
  final DateTime date;
  final String? time;
  final List<BookingSlot> slots;
  final bool loadingSlots, submitting;
  final String? error;
}
```

### 2. `discover_screen.dart` (765) → hedef ≤ 200

| Yeni dosya | Şimdiki |
|------------|---------|
| `filter_sheet.dart` | `_FilterState` + filter UI bloğu (106-344 arası) |
| `sort_menu.dart` | `_sortMenuItem` |
| `empty_state.dart` | `_buildEmptyState` |
| `discover_salon_card.dart` | `_DiscoverSalonCard` (639-665) |

`_FilterState` (12-53) bir business state → `DiscoverFilterNotifier extends Notifier<FilterState>`'a taşınmalı; `setState` sadece UI ephemeral state için kalmalı.

### 3. `write_review_screen.dart` (457) → hedef ≤ 200

| Yeni dosya | Şimdiki |
|------------|---------|
| `salon_info_card.dart` | build içindeki salon info Container (56-104) |
| `rating_selector.dart` | yıldız bloğu (110-145) |
| `photo_picker_row.dart` | `_pickImage` tetikleyici + preview grid (185-240) |
| `success_dialog.dart` | `_submitReview` içindeki Dialog (410-450) |

### 4. `salon_detail_screen.dart` (441) → hedef ≤ 200

| Yeni dosya | Şimdiki |
|------------|---------|
| `cover_header.dart` | build başı + `_coverPlaceholder` |
| `info_row.dart` | `_infoRow` |
| `action_chip.dart` | `_buildActionChip`, `_buildCircleButton` |
| `tab_bar_delegate.dart` | `_TabBarDelegate` (424-441) |

Zaten `presentation/widgets/`'te olanlar: `review_list_widget.dart`, `service_list_widget.dart`, `staff_list_widget.dart` — yerinde.

### 5. `home_screen.dart` (411) → hedef ≤ 200

| Yeni dosya | Şimdiki |
|------------|---------|
| `section_header.dart` | `_SectionHeader` (330-351) |
| `category_chip.dart` | `_CategoryChip` (352-411) |

`_SectionHeader`/`_CategoryChip` 2+ feature tarafından kullanılırsa `core/widgets/`'e taşınır.

### 6. `appointments_screen.dart` (354) → hedef ≤ 200

| Yeni dosya | Şimdiki |
|------------|---------|
| `appointment_card.dart` | `_AppointmentCard` (179-354) + `_buildStatusBadge`, `_buildInfoChip` |

### 7. `profile_screen.dart` (351) → hedef ≤ 200

| Yeni dosya | Şimdiki |
|------------|---------|
| `menu_section.dart` | `_buildSection` + `_MenuItem` (344+) |
| `stat_tile.dart` | `_buildStat` |

### 8. `edit_profile_screen.dart` (428) → hedef ≤ 200

| Yeni dosya | Şimdiki |
|------------|---------|
| `form_field.dart` | tekrarlayan `TextFormField` blokları |
| `avatar_picker.dart` | avatar bloğu (CA-005 ile birleşir) |

### 9. `login_screen.dart` (293), `forgot_password_screen.dart` (254), `favorites_screen.dart` (226)

Düşük öncelik. Sadece `build()` içinde 60+ satırlık blok varsa çıkar:
- `login_screen`: `auth_footer.dart`
- `forgot_password_screen`: `email_form.dart`
- `favorites_screen`: `favorite_salon_row.dart`

### 10. `reset_password_screen.dart` (417)

`otp_input_field.dart` zaten `presentation/widgets/`'te. Kalan: `password_fields.dart`, `otp_form.dart`.

---

## Uygulananlar

### `booking_screen.dart` 775 → 181 satır
`features/booking/presentation/widgets/`: `step_indicator.dart`, `service_step.dart` (+ `ServiceBar`), `staff_step.dart` (+ `StaffOption`), `date_time_step.dart` (+ `TimeSummaryBar`), `confirm_step.dart` (+ `ConfirmRow`), `bottom_buttons.dart`. Ekran artık yalnızca `BookingState` okur ve notifier'a olay gönderir. `formatDuration`/`addMinutes` → `core/utils/time_format.dart`.

### `discover_screen.dart` 765 → ~215 satır
- `presentation/providers/discover_provider.dart` — `FilterState` + `DiscoverState` + `DiscoverNotifier` (filtreleme/sıralama build() içinde değil, CLAUDE.md §10)
- `presentation/widgets/filter_sheet.dart`, `discover_salon_card.dart`
- Ekran: search bar + chips + sort menu + grid; `_filterAndSort` kaldırıldı

### Sonraki turda bölünenler
| Dosya | Önce | Sonra |
|---|---|---|
| `write_review_screen.dart` | 450 | 190 → `salon_info_card`, `rating_selector`, `photo_picker_row`, `image_source_dialog`, `success_dialog`, `submit_bar` |
| `salon_detail_screen.dart` | 443 | ~140 → `cover_header` (+`CircleIconButton`), `salon_info_section` (+`InfoRow`, `ActionChipWidget`, `GalleryStrip`), `tab_bar_delegate` |
| `edit_profile_screen.dart` | 428 | ~170 → `app_text_field`, `password_field`, `change_password_sheet`, `change_password_tile`, `avatar_picker` |
| `home_screen.dart` | 403 | ~180 → `banner_header` (+`SalonCarousel`), `section_header`, `category_chip` |
| `appointments_screen.dart` | 355 | ~180 → `appointment_card` |
| `profile_screen.dart` | 352 | ~110 → `menu_section` (+`ProfileMenuItem`), `profile_header`, `stats_row`, `profile_dialogs` |
| `salon_card.dart` | 330 | ~100 → `salon_card_image` (+`CardBadge`), `salon_card_content` (+`RatingRow`, `TagChips`, `InfoLine`), `salon_card_shimmer` |
| `login_screen.dart` | 294 | ~150 → `auth_logo`, `auth_footer_links`, `gradient_button`, `email_field`, `auth_password_field` |
| `forgot_password_screen.dart` | 256 | ~120 → `auth_header`, `email_field`, `gradient_button` |
| `discover_screen.dart` | 259 | ~180 → `search_bar` (+`SortMenu`), `discover_states` (`EmptyState`, `ErrorState`) |
| `filter_sheet.dart` | 258 | ~180 → `chip_selector` (+`ChipOption`), `star_rating_input` |
| `reset_password_screen.dart` | 418 | ~190 → `auth_header`, `email_field`, `email_display_card`, `auth_password_field`, `otp_section`, `gradient_button` |
| `review_list_widget.dart` | 215 | ~45 → `rating_summary`, `review_card` |
| `date_time_step.dart` | 226 | ~120 → `date_strip` (+`SlotGrid`) |

> **Tool quirk:** private widget sınıflarını script'le taşırken `list.remove(line)` ilk eşleşmeyi siler → dosyayı bozar. Block dilimi alınmalı, satır satır `remove` yapılmamalı. Bu yüzden bozulan 4 ekran elle yeniden yazıldı.

> **Bulgu:** `Salon` entity'sinde `category`/`categoryName` alanı yok → category chip'leri listeyi filtrelemiyor (CA-007 eksik). Fiyat/servis filtreleri de UI'da seçiliyor ama `results()`te uygulanmıyor (sadece minRating + arama).

## Kalan dosyalar

Widget/ekran dosyalarında 200+ satır kalmadı. 200+ olanlar widget değil:
`core/l10n/app_strings.dart` (314), `core/di/injection.config.dart` (262, generated), `app/theme/app_theme.dart` (254), `booking/presentation/providers/booking_provider.dart` (244), `salon_detail/data/models/salon_detail_model.dart` (228).

---

## Kurallar (bölüm yaparken)

1. Private `_Xxx` sınıfları `presentation/widgets/` dosyasına public olarak taşınır.
2. Widget'lar **state taşımaz** — state ve callback parametre olarak gelir.
3. `build()` içinde business logic kalmaz (CLAUDE.md §10).
4. `const`-eligible her widget `const` olmalı.
5. Bölünen widget için widget testi eklenir (CA-015 §3).

---

## Doğrulama

```bash
cd apps/customer_app
for f in $(find lib -name "*.dart" -not -name "*.g.dart" -not -name "*.freezed.dart"); do
  n=$(wc -l < "$f"); [ "$n" -gt 200 ] && echo "$n $f";
done
# hedef: sadece core/l10n, app_theme, generated dosyalar kalır
flutter analyze && flutter test
```
