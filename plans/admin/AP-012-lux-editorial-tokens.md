# AP-012 — LX-001 “lux editorial” token paleti (admin_panel light + dark)

**Durum:** UYGULANDI · **Tarih:** 2026-10-28 · **Görev:** `task_dcde243b662d` (A1) · **Hedef uygulama:** `apps/admin_panel`
**Kapsam:** yalnız token katmanı (renk değerleri). Bileşen, layout, radius, gölge ve tipografi **değişmedi**.
**Kanıt:** `node scripts/wcag_tokens.js --scope admin --strict` → **EXIT=0** (eşik altı çift: 0) · `npm run typecheck` **0** · `npm run lint` **0** · `npm test` **180 node + 283 vitest, 0 fail**.

---

## 1. Hedef

Ortak LX-001 paletini (sıcak kırık beyaz zemin + mor marka + şampanya vurgu) admin panele uygulamak. Tek tasarım sözleşmesi `apps/admin_panel/src/app/globals.css` içindeki `:root` (light) ve `.dark` bloklarıdır; sayfalar semantic token kullandığı için tek dosya değişikliği tüm paneli döndürür.

Değişen iki dosya:

| Dosya | Değişiklik |
|---|---|
| `apps/admin_panel/src/app/globals.css` | `:root` **27/28** token, `.dark` **28/28** token hex güncellendi; `@theme` / `@theme inline` / `--ring` **dokunulmadı** |
| `docs/ADMIN-PANEL.md` | “Tasarım tokenları” hex tablosu yeni palete göre yenilendi + şampanya kuralı notu |

---

## 2. Eski → Yeni (light, `:root`)

| Token | Eski | Yeni |
|---|---|---|
| `--background` | `#F1F0F7` | `#F4EEE3` |
| `--surface` | `#FFFFFF` | `#FFFDF8` |
| `--surface-variant` | `#EFEDF7` | `#F1E9DC` |
| `--border` | `#DDD8EA` | `#DFD5C4` |
| `--border-strong` | `#C3BCD9` | `#C6B9A3` |
| `--fg` | `#1E1B2E` | `#1A1815` |
| `--fg-muted` | `#5A5370` | `#5C5449` |
| `--fg-subtle` | `#6E6785` | `#736959` |
| `--primary` | `#7C5CBF` | `#6B4FB8` |
| `--primary-dark` | `#5A42A0` | `#43307F` |
| `--primary-light` | `#9D82D4` | `#9A82D0` |
| `--primary-solid` | `#6A4CB4` | `#4E3893` |
| `--primary-solid-hover` | `#5A42A0` | `#43307F` |
| `--on-primary` | `#FFFFFF` | `#FFFFFF` (**değişmedi**) |
| `--secondary` | `#F0EBF8` | `#EFE6D8` |
| `--accent` | `#B39DDB` | `#C9B79A` |
| `--accent-lime` | `#C9F04F` | `#C6A664` (şampanya) |
| `--on-accent-lime` | `#12131F` | `#1A1815` |
| `--nav-pill` | `#17131F` | `#1A1815` |
| `--on-nav-pill` | `#FFFFFF` | `#F4EEE3` |
| `--on-nav-pill-muted` | `#A9A3B8` | `#B7AC99` |
| `--hero-surface` | `#E8E5FA` | `#EFE6D8` |
| `--banner-from` | `#9B7FE0` | `#4E3893` |
| `--banner-to` | `#6644B8` | `#2A1F52` |
| `--success` | `#2F7D57` | `#2F6B4F` |
| `--error` | `#B32B38` | `#A8323C` |
| `--warning` | `#8A5A00` | `#7A5200` |
| `--info` | `#1F5FA8` | `#2A5A8C` |

## 3. Eski → Yeni (dark, `.dark`)

| Token | Eski | Yeni |
|---|---|---|
| `--background` | `#0F0D17` | `#14110D` |
| `--surface` | `#1C1828` | `#221C16` |
| `--surface-variant` | `#2A2440` | `#2C241C` |
| `--border` | `#332E4C` | `#3D3327` |
| `--border-strong` | `#4A4368` | `#5A4C3B` |
| `--fg` | `#F0ECFF` | `#F4EDE1` |
| `--fg-muted` | `#A79FC0` | `#BDB2A0` |
| `--fg-subtle` | `#8B84A8` | `#9A8F7C` |
| `--primary` | `#A88BDD` | `#B29AE8` |
| `--primary-dark` | `#7C5CBF` | `#9C82DC` |
| `--primary-light` | `#C4B0EA` | `#C9B6F0` |
| `--primary-solid` | `#9D82D4` | `#9C82DC` |
| `--primary-solid-hover` | `#B49BE4` | `#8F72D8` |
| `--on-primary` | `#1C1828` | `#14110D` |
| `--secondary` | `#2A2440` | `#2C241C` |
| `--accent` | `#B39DDB` | `#D8C6A4` |
| `--accent-lime` | `#C9F04F` | `#D8B872` (şampanya) |
| `--on-accent-lime` | `#12131F` | `#14110D` |
| `--nav-pill` | `#0A0912` | `#0E0B08` |
| `--on-nav-pill` | `#F0ECFF` | `#F4EDE1` |
| `--on-nav-pill-muted` | `#8B84A8` | `#A79C88` |
| `--hero-surface` | `#2A2440` | `#2C241C` |
| `--banner-from` | `#6A5298` | `#3A2A6E` |
| `--banner-to` | `#4A3779` | `#1E1440` |
| `--success` | `#7CCBA2` | `#6FC08F` |
| `--error` | `#F28B82` | `#F08A8A` |
| `--warning` | `#FDD663` | `#E0B060` |
| `--info` | `#8AB4F8` | `#8AB4E8` |

---

## 4. Bilinçli kararlar

- **Şampanya metin değildir.** `--accent-lime` (`#C6A664` / `#D8B872`) yalnızca dolgu, kenarlık, hairline ve ikon olarak kullanılır. Metin gerektiren yerde `--fg` / `--on-accent-lime` kullanılır. `wcag_tokens.js` bu çifti `EXPECTED_FAIL` listesinde tutar (kural ihlali değil, belgelenmiş istisna).
- **`--on-primary` light'ta değişmedi** (`#FFFFFF`), çünkü yeni `--primary-solid` (`#4E3893`) beyaz metinle 9.09:1 (AAA) veriyor.
- **`--ring` korundu:** `color-mix(in srgb, var(--primary) 35%/45%, transparent)` — primary değişince odak halkası kendiliğinden yeni tona döner, sabit hex yazılmadı.
- **`@theme` / `@theme inline` blokları değişmedi:** token→Tailwind eşlemesi, radius ve gölge tanımları aynı kaldı; bu görev yalnız değer katmanı.

## 5. Kapsam dışı (bu görevde dokunulmadı)

- `src/app/layout.tsx`, `src/components/**`, `src/app/**` sayfaları — hiçbir bileşende renk utility'si (`bg-white`, `text-gray-500` vb.) yazılmadı/değiştirilmedi.
- Radius (`kart 2px · buton 4px · input 2px · sheet 8px`, alt gezinme hapı `999`) ve gölge tanımları.
- `package.json` / bağımlılıklar.
- Mobil uygulama (`apps/customer_app/lib/app/theme/app_colors.dart`) — ayrı görev.
- Bu worktree'de başka ajanların commit edilmemiş işi var; **hiçbir git yazma komutu çalıştırılmadı** (`add/commit/stash/checkout/reset` yok).

## 6. Doğrulama (çalıştırıldı, çıktı saklandı)

```bash
cd /home/baris/orca/beauty-salon
node scripts/wcag_tokens.js --scope admin --strict; echo EXIT=$?   # EXIT=0
cd apps/admin_panel
npm run typecheck                                                  # tsc --noEmit, çıkış 0
npm run lint                                                       # eslint, çıkış 0 (uyarı yok)
npm run test                                                       # 180 node + 283 vitest, 0 fail
```

| Kapı | Sonuç |
|---|---|
| WCAG admin matrisi (`--strict`) | **EXIT=0**, eşik altı çift **0** |
| `npm run typecheck` | çıkış **0**, hata yok |
| `npm run lint` | çıkış **0**, hata/uyarı yok |
| `npm run test` | **180** node testi + **283** vitest / **33** dosya, **0 fail** |
| `git diff --stat` | aşağıda §8 |

## 7. WCAG matrisi (tam çıktı)

```

=== admin_panel  (globals.css — MEVCUT) ===
-- light
    15.34  AAA            fg on background                              #1A1815 on #F4EEE3
    17.43  AAA            fg on surface                                 #1A1815 on #FFFDF8
     7.33  AAA            fg-muted on surface                           #5C5449 on #FFFDF8
     6.45  AA             fg-muted on background                        #5C5449 on #F4EEE3
     5.31  AA             fg-subtle on surface                          #736959 on #FFFDF8
     4.67  AA             fg-subtle on background                       #736959 on #F4EEE3
     6.11  AA             on-primary on primary                         #FFFFFF on #6B4FB8
     9.09  AAA            on-primary on primary-solid                   #FFFFFF on #4E3893
     6.01  AA             primary on surface (link/ikon)                #6B4FB8 on #FFFDF8
     1.43  ok (>=1.3)     border vs surface (ayraç)                     #DFD5C4 on #FFFDF8
     1.14  ok (>=1.1)     surface vs background (kart ayrımı)           #FFFDF8 on #F4EEE3
      1.9  ok (>=1.4)     border-strong vs surface                      #C6B9A3 on #FFFDF8
     7.63  AAA            on-accent-lime on accent-lime (lime CTA)      #1A1815 on #C6A664
     2.29  FAIL           accent-lime on surface (lime METİN)           #C6A664 on #FFFDF8
    15.34  AAA            on-nav-pill on nav-pill (koyu yan menü)       #F4EEE3 on #1A1815
    14.32  AAA            fg on hero-surface                            #1A1815 on #EFE6D8
     6.18  AA             fg-muted on surface-variant                   #5C5449 on #F1E9DC
     6.48  AA             error on surface                              #A8323C on #FFFDF8
     6.19  AA             success on surface                            #2F6B4F on #FFFDF8
-- dark
    16.18  AAA            fg on background                              #F4EDE1 on #14110D
    14.49  AAA            fg on surface                                 #F4EDE1 on #221C16
     8.06  AAA            fg-muted on surface                           #BDB2A0 on #221C16
        9  AAA            fg-muted on background                        #BDB2A0 on #14110D
     5.29  AA             fg-subtle on surface                          #9A8F7C on #221C16
     5.91  AA             fg-subtle on background                       #9A8F7C on #14110D
     7.78  AAA            on-primary on primary                         #14110D on #B29AE8
     5.95  AA             on-primary on primary-solid                   #14110D on #9C82DC
     6.97  AA             primary on surface (link/ikon)                #B29AE8 on #221C16
     1.37  ok (>=1.3)     border vs surface (ayraç)                     #3D3327 on #221C16
     1.12  ok (>=1.1)     surface vs background (kart ayrımı)           #221C16 on #14110D
     2.03  ok (>=1.4)     border-strong vs surface                      #5A4C3B on #221C16
     9.88  AAA            on-accent-lime on accent-lime (lime CTA)      #14110D on #D8B872
     8.85  AAA            accent-lime on surface (lime METİN)           #D8B872 on #221C16
    16.87  AAA            on-nav-pill on nav-pill (koyu yan menü)       #F4EDE1 on #0E0B08
    13.11  AAA            fg on hero-surface                            #F4EDE1 on #2C241C
      7.3  AAA            fg-muted on surface-variant                   #BDB2A0 on #2C241C
     6.99  AA             error on surface                              #F08A8A on #221C16
     7.72  AAA            success on surface                            #6FC08F on #221C16

Eşik altı çift (metin 4.5:1 + yüzey ayrımı hedefleri): 0
EXIT=0
```

Okuma notu: `light` bloğundaki `accent-lime on surface (lime METİN)` satırı **FAIL** görünür — şampanya kuralı gereği beklenen istisna (`EXPECTED_FAIL`), sayaca dahil edilmez; bu yüzden toplam “eşik altı çift” **0**.

## 8. Diff

```
 apps/admin_panel/src/app/globals.css | 64 ++++++++++++++++++++++----------------
 docs/ADMIN-PANEL.md                  |  22 ++++++++++++++
 plans/admin/AP-012-lux-editorial-tokens.md | yeni dosya
```

`docs/ADMIN-PANEL.md` sayıları bu görevin satırlarıdır; dosyada ayrıca AP-010’dan kalan commit edilmemiş değişiklikler var (bu görev onlara dokunmadı).

## 9. Geri dönüş

Tek dosyada değer değişikliği olduğu için geri alma `globals.css` içindeki iki bloğun eski hexlere döndürülmesidir; `@theme` ve bileşenler etkilenmediği için kısmi geri alma gerekmez. Eski değerler §2/§3 tablolarında tam olarak duruyor. (Bu görevde git komutu çalıştırılmadı.)

---

## 10. divider eklendi (2026-11-01)

LX-001 sözleşmesindeki eksik divider hücresini tamamlamak amacıyla:
- `:root` (light) bloğuna `--divider: #E3D9C7`
- `.dark` bloğuna `--divider: #332B22`

eklendi. Değerler `customer_app` ve `salon_app` (`app_colors.dart`) ile birebir eşleşmektedir.
Mevcut `--border` tokeni değiştirilmedi.

Doğrulama kapıları:
- `node scripts/wcag_tokens.js --scope admin --strict` (EXIT=0, eşik altı çift: 0)
- `node scripts/wcag_tokens.js --scope mobile --strict` (EXIT=0, regresyon yok)
- `cd apps/admin_panel && npm run typecheck` (EXIT=0)
- `cd apps/admin_panel && npm run lint` (EXIT=0)

