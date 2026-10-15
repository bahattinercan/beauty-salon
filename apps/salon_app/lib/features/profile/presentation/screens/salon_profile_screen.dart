import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_theme_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/l10n/locale_provider.dart';
import '../../../../core/network/media_url.dart';
import '../../../../core/network/upload_service.dart';
import '../../../../core/theme/theme_provider.dart';
import '../../../auth/data/auth_provider.dart';
import '../../../salon/data/salon_provider.dart';

String _dayName(String key, S s) {
  switch (key) {
    case 'monday': return s.monday;
    case 'tuesday': return s.tuesday;
    case 'wednesday': return s.wednesday;
    case 'thursday': return s.thursday;
    case 'friday': return s.friday;
    case 'saturday': return s.saturday;
    case 'sunday': return s.sunday;
    default: return key;
  }
}

class SalonProfileScreen extends ConsumerWidget {
  const SalonProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = S.of(context);
    final c = context.colors;
    final salonAsync = ref.watch(salonProvider);
    final salon = salonAsync.asData?.value;
    final themeMode = ref.watch(themeProvider);

    String themeSub;
    if (themeMode == ThemeMode.dark) {
      themeSub = s.themeDark;
    } else if (themeMode == ThemeMode.light) {
      themeSub = s.themeLight;
    } else {
      themeSub = s.themeSystem;
    }

    return Scaffold(
      backgroundColor: c.background,
      body: CustomScrollView(
        slivers: [
          // Gradient header
          SliverToBoxAdapter(
            child: Container(
              decoration: const BoxDecoration(
                gradient: AppColors.headerGradient,
                borderRadius: BorderRadius.vertical(bottom: Radius.circular(32)),
              ),
              padding: EdgeInsets.only(
                top: MediaQuery.of(context).padding.top + 24,
                left: 20,
                right: 20,
                bottom: 32,
              ),
              child: Column(
                children: [
                  Container(
                    width: 86, height: 86,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.3), width: 2),
                    ),
                    child: salon?.logoUrl != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(24),
                            child: Image.network(
                              resolveMediaUrl(salon!.logoUrl),
                              fit: BoxFit.cover,
                              errorBuilder: (_, _, _) =>
                                  const Icon(Icons.store_rounded, size: 44, color: Colors.white),
                            ),
                          )
                        : const Icon(Icons.store_rounded, size: 44, color: Colors.white),
                  ),
                  const SizedBox(height: 14),
                  Text(salon?.name ?? '...', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white)),
                  const SizedBox(height: 4),
                  if (salon?.address != null)
                    Text(salon!.address!, style: const TextStyle(fontSize: 13, color: Colors.white70), textAlign: TextAlign.center),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (salon?.isVerified == true)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(20)),
                          child: Row(
                            children: [
                              const Icon(Icons.check_circle_rounded, size: 14, color: Colors.white),
                              const SizedBox(width: 4),
                              Text(s.verified, style: const TextStyle(fontSize: 12, color: Colors.white, fontWeight: FontWeight.w600)),
                            ],
                          ),
                        ),
                      if (salon?.isVerified == true) const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(20)),
                        child: Row(
                          children: [
                            const Icon(Icons.star_rounded, size: 14, color: Color(0xFFFFD95A)),
                            const SizedBox(width: 4),
                            Text((salon?.ratingAvg ?? 0).toStringAsFixed(1), style: const TextStyle(fontSize: 12, color: Colors.white, fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
              // Stats card
              Container(
                padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
                decoration: BoxDecoration(
                  color: c.surface,
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.08), blurRadius: 16, offset: const Offset(0, 4))],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildStat('${salon?.reviewCount ?? 0}', s.reviewCount, c),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              _buildSection(context, s.salonInfo, c, [
                if (salon?.name != null)
                  _MenuItem(icon: Icons.store_outlined, title: s.salonName, subtitle: salon!.name, onTap: () => _showEditSalonSheet(context, ref, salon)),
                if (salon?.phone != null)
                  _MenuItem(icon: Icons.phone_outlined, title: s.phone, subtitle: salon!.phone!, onTap: () => _showPhoneChangeSheet(context, ref, salon)),
                if (salon?.email != null)
                  _MenuItem(icon: Icons.email_outlined, title: s.emailFieldLabel, subtitle: salon!.email!, onTap: () => _showEmailChangeSheet(context, ref, salon)),
                if (salon?.address != null)
                  _MenuItem(icon: Icons.location_on_outlined, title: s.address, subtitle: salon!.address!, onTap: () => _showEditSalonSheet(context, ref, salon)),
                if (salon?.description != null)
                  _MenuItem(icon: Icons.description_outlined, title: s.description, subtitle: salon!.description!, onTap: () => _showEditSalonSheet(context, ref, salon)),
                _MenuItem(icon: Icons.edit_outlined, title: s.editSalonInfo, subtitle: '', onTap: () => _showEditSalonSheet(context, ref, salon)),
              ]),
              const SizedBox(height: 16),
              _SalonGallerySection(salon: salon),
              const SizedBox(height: 16),
              _buildSection(context, s.workingHours, c, [
                ..._buildWorkingHoursItems(salon, s, context, ref),
              ]),
              const SizedBox(height: 16),
              _buildSection(context, s.settings, c, [
                _MenuItem(icon: Icons.notifications_outlined, title: s.notificationSettings, subtitle: '', onTap: () {}),
                _MenuItem(icon: Icons.lock_outlined, title: s.changePassword, subtitle: '', onTap: () => _showChangePasswordSheet(context, ref)),
                _MenuItem(
                  icon: Icons.language,
                  title: s.language,
                  subtitle: s.isEn ? s.english : s.turkish,
                  onTap: () => _showLanguageDialog(context, ref, s),
                ),
                _MenuItem(
                  icon: Icons.dark_mode_outlined,
                  title: s.themeLabel,
                  subtitle: themeSub,
                  onTap: () => _showThemeDialog(context, ref, s, themeMode),
                ),
              ]),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => _showLogoutDialog(context, ref, s),
                  icon: const Icon(Icons.logout, color: AppColors.error),
                  label: Text(s.signOut, style: const TextStyle(color: AppColors.error)),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    side: const BorderSide(color: AppColors.error),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
              const SizedBox(height: 10),
              // SA-003: Salon silme butonu
              if (salon != null)
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () => _showDeleteSalonDialog(context, ref, salon, s),
                    icon: const Icon(Icons.delete_forever_outlined, color: Colors.red),
                    label: const Text('Salonu Sil', style: TextStyle(color: Colors.red)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      side: const BorderSide(color: Colors.red),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              const SizedBox(height: 16),
              Text('Salon App v1.0.0', style: TextStyle(fontSize: 12, color: c.textHint), textAlign: TextAlign.center),
              const SizedBox(height: 20),
            ]),
          ),
        ),
      ],
    ),
  );
  }

  Widget _buildStat(String value, String label, AppThemeColors c) {
    return Column(
      children: [
        Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primary)),
        const SizedBox(height: 2),
        Text(label, style: TextStyle(fontSize: 12, color: c.textSecondary)),
      ],
    );
  }

  Widget _buildSection(BuildContext context, String title, AppThemeColors c, List<_MenuItem> items) {
    if (items.isEmpty) return const SizedBox();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: c.textSecondary)),
        ),
        Container(
          decoration: BoxDecoration(
            color: c.surface,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 10, offset: const Offset(0, 2))],
          ),
          child: Column(
            children: items.asMap().entries.map((entry) {
              final index = entry.key;
              final item = entry.value;
              return Column(
                children: [
                  ListTile(
                    leading: Container(
                      width: 38, height: 38,
                      decoration: BoxDecoration(color: c.secondaryBg, borderRadius: BorderRadius.circular(10)),
                      child: Icon(item.icon, color: AppColors.primary, size: 20),
                    ),
                    title: Text(item.title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                    subtitle: item.subtitle.isNotEmpty
                        ? Text(item.subtitle, style: TextStyle(fontSize: 12, color: c.textSecondary))
                        : null,
                    trailing: Icon(Icons.chevron_right, color: c.textHint, size: 20),
                    onTap: item.onTap,
                  ),
                  if (index < items.length - 1) Divider(height: 1, indent: 66, color: c.surfaceVariant),
                ],
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  List<_MenuItem> _buildWorkingHoursItems(SalonInfo? salon, S s, BuildContext context, WidgetRef ref) {
    final items = <_MenuItem>[];
    for (final key in kDayKeys) {
      final day = salon?.workingHours[key];
      final subtitle = day == null
          ? s.closed
          : day.isClosed
              ? s.closed
              : '${day.open} - ${day.close}';
      items.add(_MenuItem(
        icon: Icons.access_time,
        title: _dayName(key, s),
        subtitle: subtitle,
        onTap: () => _showWorkingHoursSheet(context, ref, salon),
      ));
    }
    items.add(_MenuItem(
      icon: Icons.edit_outlined,
      title: s.editWorkingHours,
      subtitle: '',
      onTap: () => _showWorkingHoursSheet(context, ref, salon),
    ));
    return items;
  }

  void _showWorkingHoursSheet(BuildContext context, WidgetRef ref, SalonInfo? salon) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _WorkingHoursSheet(salon: salon, ref: ref),
    );
  }

  void _showChangePasswordSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _ChangePasswordSheet(ref: ref),
    );
  }

  void _showPhoneChangeSheet(BuildContext context, WidgetRef ref, SalonInfo? salon) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _ContactChangeSheet(
        salon: salon,
        ref: ref,
        isEmail: false,
      ),
    );
  }

  void _showEmailChangeSheet(BuildContext context, WidgetRef ref, SalonInfo? salon) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _ContactChangeSheet(
        salon: salon,
        ref: ref,
        isEmail: true,
      ),
    );
  }

  void _showEditSalonSheet(BuildContext context, WidgetRef ref, SalonInfo? salon) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _SalonEditSheet(salon: salon, ref: ref),
    );
  }

  void _showThemeDialog(BuildContext context, WidgetRef ref, S s, ThemeMode current) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(s.themeLabel),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: Text(s.themeSystem),
              trailing: current == ThemeMode.system ? const Icon(Icons.check, color: AppColors.primary) : null,
              onTap: () { ref.read(themeProvider.notifier).setTheme(ThemeMode.system); Navigator.pop(ctx); },
            ),
            ListTile(
              title: Text(s.themeLight),
              trailing: current == ThemeMode.light ? const Icon(Icons.check, color: AppColors.primary) : null,
              onTap: () { ref.read(themeProvider.notifier).setTheme(ThemeMode.light); Navigator.pop(ctx); },
            ),
            ListTile(
              title: Text(s.themeDark),
              trailing: current == ThemeMode.dark ? const Icon(Icons.check, color: AppColors.primary) : null,
              onTap: () { ref.read(themeProvider.notifier).setTheme(ThemeMode.dark); Navigator.pop(ctx); },
            ),
          ],
        ),
      ),
    );
  }

  void _showLanguageDialog(BuildContext context, WidgetRef ref, S s) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(s.language),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: Text(s.turkish),
              trailing: s.lang == 'tr' ? const Icon(Icons.check, color: AppColors.primary) : null,
              onTap: () {
                ref.read(localeProvider.notifier).setLocale(const Locale('tr'));
                Navigator.pop(ctx);
              },
            ),
            ListTile(
              title: Text(s.english),
              trailing: s.lang == 'en' ? const Icon(Icons.check, color: AppColors.primary) : null,
              onTap: () {
                ref.read(localeProvider.notifier).setLocale(const Locale('en'));
                Navigator.pop(ctx);
              },
            ),
          ],
        ),
      ),
    );
  }

  // SA-003: Salon silme onay dialog'u
  void _showDeleteSalonDialog(BuildContext context, WidgetRef ref, SalonInfo salon, S s) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Salonu Sil'),
        content: const Text('Bu salonu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('İptal')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () async {
              Navigator.pop(ctx);
              await ref.read(salonProvider.notifier).deleteSalon(salon.id);
              if (context.mounted) context.go('/login');
            },
            child: const Text('Sil', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showLogoutDialog(BuildContext context, WidgetRef ref, S s) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(s.signOutConfirmTitle),
        content: Text(s.signOutConfirmBody),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text(s.cancel)),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(authProvider.notifier).logout();
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: Text(s.signOut, style: const TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}

class _MenuItem {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  _MenuItem({required this.icon, required this.title, required this.subtitle, required this.onTap});
}

class _SalonGallerySection extends ConsumerWidget {
  final SalonInfo? salon;
  const _SalonGallerySection({required this.salon});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = S.of(context);
    final c = context.colors;
    final gallery = salon?.galleryImages ?? const <String>[];
    final cover = salon?.coverImageUrl;
    final images = <String>[
      ?cover,
      ...gallery,
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.photo_album_outlined, size: 20, color: AppColors.primary),
              const SizedBox(width: 8),
              Text(s.photos, style: const TextStyle(fontWeight: FontWeight.w700)),
              const Spacer(),
              TextButton.icon(
                onPressed: () => _addPhotos(context, ref, gallery),
                icon: const Icon(Icons.add, size: 18),
                label: Text(s.addPhotos),
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (images.isEmpty)
            Text(s.noPhotos, style: TextStyle(fontSize: 12, color: c.textSecondary))
          else
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  for (final url in images)
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: Container(
                        width: 96,
                        height: 96,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: c.surfaceVariant),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.network(
                            resolveMediaUrl(url),
                            fit: BoxFit.cover,
                            errorBuilder: (_, _, _) => const Icon(Icons.broken_image_outlined, size: 28),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _addPhotos(BuildContext context, WidgetRef ref, List<String> existing) async {
    final s = S.of(context);
    final picked = await ImagePicker().pickMultiImage(limit: 5);
    if (picked.isEmpty) return;

    try {
      final urls = await UploadService().uploadImages(picked);
      if (urls.isEmpty) return;
      await ref.read(salonProvider.notifier).updateInfo({
        'galleryImages': [...existing, ...urls],
        if (existing.isEmpty) 'coverImageUrl': urls.first,
      });
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${s.photosAdded} (${urls.length})')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(s.errorMsg('$e')), backgroundColor: AppColors.error),
        );
      }
    }
  }
}

class _SalonEditSheet extends StatefulWidget {
  final SalonInfo? salon;
  final WidgetRef ref;
  const _SalonEditSheet({required this.salon, required this.ref});

  @override
  State<_SalonEditSheet> createState() => _SalonEditSheetState();
}

class _SalonEditSheetState extends State<_SalonEditSheet> {
  late final TextEditingController _nameCtrl;
  late final TextEditingController _addressCtrl;
  late final TextEditingController _descCtrl;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _nameCtrl    = TextEditingController(text: widget.salon?.name ?? '');
    _addressCtrl = TextEditingController(text: widget.salon?.address ?? '');
    _descCtrl    = TextEditingController(text: widget.salon?.description ?? '');
  }

  @override
  void dispose() {
    _nameCtrl.dispose(); _addressCtrl.dispose(); _descCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final c = context.colors;
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        decoration: BoxDecoration(
          color: c.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40, height: 4,
              decoration: BoxDecoration(color: c.textHint, borderRadius: BorderRadius.circular(2)),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(s.editSalonInfo, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                ],
              ),
            ),
            SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                children: [
                  TextField(controller: _nameCtrl, decoration: InputDecoration(labelText: s.salonName, prefixIcon: const Icon(Icons.store_outlined))),
                  const SizedBox(height: 14),
                  TextField(controller: _addressCtrl, decoration: InputDecoration(labelText: s.address, prefixIcon: const Icon(Icons.location_on_outlined))),
                  const SizedBox(height: 14),
                  TextField(controller: _descCtrl, maxLines: 3, decoration: InputDecoration(labelText: s.description, prefixIcon: const Icon(Icons.description_outlined))),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _saving ? null : _save,
                      child: _saving
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : Text(s.save),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _save() async {
    if (_nameCtrl.text.trim().isEmpty) return;
    setState(() => _saving = true);
    final s = S.of(context);
    try {
      await widget.ref.read(salonProvider.notifier).updateInfo({
        'name': _nameCtrl.text.trim(),
        if (_addressCtrl.text.trim().isNotEmpty) 'address': _addressCtrl.text.trim(),
        if (_descCtrl.text.trim().isNotEmpty) 'description': _descCtrl.text.trim(),
      });
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(s.errorMsg('$e')), backgroundColor: Colors.red));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}

class _ChangePasswordSheet extends StatefulWidget {
  final WidgetRef ref;
  const _ChangePasswordSheet({required this.ref});

  @override
  State<_ChangePasswordSheet> createState() => _ChangePasswordSheetState();
}

class _ChangePasswordSheetState extends State<_ChangePasswordSheet> {
  final _currentCtrl = TextEditingController();
  final _newCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _saving = false;
  bool _obscureCurrent = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;

  @override
  void dispose() {
    _currentCtrl.dispose();
    _newCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final s = S.of(context);
    if (_currentCtrl.text.isEmpty || _newCtrl.text.isEmpty) return;
    if (_newCtrl.text != _confirmCtrl.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(s.passwordsDoNotMatch), backgroundColor: Colors.red),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      final apiClient = widget.ref.read(authProvider.notifier);
      await apiClient.changePassword(_currentCtrl.text, _newCtrl.text);
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(s.passwordChangedSuccess)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(s.errorMsg('$e')), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final c = context.colors;
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        decoration: BoxDecoration(
          color: c.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40, height: 4,
              decoration: BoxDecoration(color: c.textHint, borderRadius: BorderRadius.circular(2)),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(s.changePassword, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                ],
              ),
            ),
            SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                children: [
                  TextField(
                    controller: _currentCtrl,
                    obscureText: _obscureCurrent,
                    decoration: InputDecoration(
                      labelText: s.currentPassword,
                      prefixIcon: const Icon(Icons.lock_outlined),
                      suffixIcon: IconButton(
                        icon: Icon(_obscureCurrent ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                        onPressed: () => setState(() => _obscureCurrent = !_obscureCurrent),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _newCtrl,
                    obscureText: _obscureNew,
                    decoration: InputDecoration(
                      labelText: s.newPassword,
                      prefixIcon: const Icon(Icons.lock_outlined),
                      suffixIcon: IconButton(
                        icon: Icon(_obscureNew ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                        onPressed: () => setState(() => _obscureNew = !_obscureNew),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _confirmCtrl,
                    obscureText: _obscureConfirm,
                    decoration: InputDecoration(
                      labelText: s.newPasswordConfirm,
                      prefixIcon: const Icon(Icons.lock_outlined),
                      suffixIcon: IconButton(
                        icon: Icon(_obscureConfirm ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                        onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _saving ? null : _save,
                      child: _saving
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : Text(s.save),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _WorkingHoursSheet extends StatefulWidget {
  final SalonInfo? salon;
  final WidgetRef ref;
  const _WorkingHoursSheet({required this.salon, required this.ref});

  @override
  State<_WorkingHoursSheet> createState() => _WorkingHoursSheetState();
}

class _WorkingHoursSheetState extends State<_WorkingHoursSheet> {
  late Map<String, WorkingDay> _hours;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _hours = {
      for (final key in kDayKeys)
        key: widget.salon?.workingHours[key] ?? WorkingDay.defaultOpen,
    };
  }

  Future<void> _pickTime(String dayKey, bool isOpen) async {
    final current = _hours[dayKey]!;
    final parts = (isOpen ? current.open : current.close).split(':');
    final initial = TimeOfDay(hour: int.parse(parts[0]), minute: int.parse(parts[1]));
    final picked = await showTimePicker(context: context, initialTime: initial);
    if (picked == null) return;
    final formatted = '${picked.hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')}';
    setState(() {
      _hours[dayKey] = WorkingDay(
        open: isOpen ? formatted : current.open,
        close: isOpen ? current.close : formatted,
        isClosed: current.isClosed,
      );
    });
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await widget.ref.read(salonProvider.notifier).updateInfo({
        'workingHours': {
          for (final e in _hours.entries) e.key: e.value.toJson(),
        },
      });
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        final s = S.of(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(s.errorMsg('$e')), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final c = context.colors;
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        decoration: BoxDecoration(
          color: c.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40, height: 4,
              decoration: BoxDecoration(color: c.textHint, borderRadius: BorderRadius.circular(2)),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 8, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(s.editWorkingHours, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                ],
              ),
            ),
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  children: [
                    ...kDayKeys.map((key) {
                      final day = _hours[key]!;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Row(
                          children: [
                            SizedBox(
                              width: 90,
                              child: Text(_dayName(key, s), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                            ),
                            Switch(
                              value: !day.isClosed,
                              activeThumbColor: AppColors.primary,
                              onChanged: (val) => setState(() {
                                _hours[key] = WorkingDay(open: day.open, close: day.close, isClosed: !val);
                              }),
                            ),
                            if (!day.isClosed) ...[
                              const SizedBox(width: 4),
                              _TimeChip(time: day.open, onTap: () => _pickTime(key, true)),
                              const Padding(
                                padding: EdgeInsets.symmetric(horizontal: 4),
                                child: Text('-', style: TextStyle(fontWeight: FontWeight.bold)),
                              ),
                              _TimeChip(time: day.close, onTap: () => _pickTime(key, false)),
                            ] else
                              Padding(
                                padding: const EdgeInsets.only(left: 8),
                                child: Text(s.closed, style: TextStyle(color: c.textHint, fontSize: 13)),
                              ),
                          ],
                        ),
                      );
                    }),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _saving ? null : _save,
                        child: _saving
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : Text(s.save),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TimeChip extends StatelessWidget {
  final String time;
  final VoidCallback onTap;
  const _TimeChip({required this.time, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: c.secondaryBg,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.primary.withValues(alpha: 0.4)),
        ),
        child: Text(time, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.primary)),
      ),
    );
  }
}

/// Telefon veya e-posta değişikliği için tek ortak sheet.
/// [isEmail] = true → e-posta değişikliği, false → telefon değişikliği
class _ContactChangeSheet extends StatefulWidget {
  final SalonInfo? salon;
  final WidgetRef ref;
  final bool isEmail;
  const _ContactChangeSheet({required this.salon, required this.ref, required this.isEmail});

  @override
  State<_ContactChangeSheet> createState() => _ContactChangeSheetState();
}

class _ContactChangeSheetState extends State<_ContactChangeSheet> {
  late final TextEditingController _valueCtrl;
  // E-posta için varsayılan: email; telefon için varsayılan: sms
  late String _verifyVia;
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    _valueCtrl = TextEditingController();
    _verifyVia = widget.isEmail ? 'email' : 'sms';
  }

  @override
  void dispose() {
    _valueCtrl.dispose();
    super.dispose();
  }

  String get _title => widget.isEmail ? S.of(context).changeEmail : S.of(context).changePhone;
  String get _label => widget.isEmail ? S.of(context).emailFieldLabel : S.of(context).newPhone;

  bool get _hasEmail => widget.salon?.email != null && widget.salon!.email!.isNotEmpty;
  bool get _hasPhone => widget.salon?.phone != null && widget.salon!.phone!.isNotEmpty;

  Future<void> _sendCode() async {
    final value = _valueCtrl.text.trim();
    if (value.isEmpty) return;
    setState(() => _sending = true);
    final verifyVia = _verifyVia;
    final isEmail = widget.isEmail;
    try {
      if (isEmail) {
        await widget.ref.read(salonProvider.notifier).requestEmailChange(value, verifyVia: verifyVia);
      } else {
        await widget.ref.read(salonProvider.notifier).requestPhoneChange(value, verifyVia: verifyVia);
      }
      if (!mounted) return;
      final s = S.of(context);
      Navigator.pop(context);
      _showOtpDialog(value, s);
    } catch (e) {
      if (!mounted) return;
      final s = S.of(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(s.errorMsg('$e')), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  void _showOtpDialog(String newValue, S s) {
    final otpCtrl = TextEditingController();
    bool confirming = false;

    // OTP nereye gönderildi mesajı
    final sentMsg = _verifyVia == 'sms'
        ? s.otpSentToPhone(widget.salon?.phone ?? '')
        : s.otpSentToEmail(widget.isEmail ? (widget.salon?.email ?? '') : (widget.salon?.email ?? ''));

    final title = widget.isEmail ? s.emailChangeOtpTitle : s.phoneChangeOtpTitle;
    final successMsg = widget.isEmail ? s.emailChanged : s.phoneChanged;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text(title),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(sentMsg, style: const TextStyle(fontSize: 13)),
              const SizedBox(height: 16),
              TextField(
                controller: otpCtrl,
                keyboardType: TextInputType.number,
                maxLength: 6,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, letterSpacing: 8),
                decoration: const InputDecoration(counterText: '', border: OutlineInputBorder()),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: Text(s.cancel)),
            ElevatedButton(
              onPressed: confirming ? null : () async {
                if (otpCtrl.text.length < 6) return;
                setDialogState(() => confirming = true);
                try {
                  if (widget.isEmail) {
                    await widget.ref.read(salonProvider.notifier).confirmEmailChange(otpCtrl.text);
                  } else {
                    await widget.ref.read(salonProvider.notifier).confirmPhoneChange(otpCtrl.text);
                  }
                  if (ctx.mounted) {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text(successMsg)));
                  }
                } catch (e) {
                  setDialogState(() => confirming = false);
                  if (ctx.mounted) {
                    ScaffoldMessenger.of(ctx).showSnackBar(
                      SnackBar(content: Text(s.errorMsg('$e')), backgroundColor: Colors.red),
                    );
                  }
                }
              },
              child: confirming
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Text(s.confirm),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final c = context.colors;
    // Mevcut değeri göster (subtitle olarak)
    final currentVal = widget.isEmail ? widget.salon?.email : widget.salon?.phone;

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        decoration: BoxDecoration(
          color: c.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40, height: 4,
              decoration: BoxDecoration(color: c.textHint, borderRadius: BorderRadius.circular(2)),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 8, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(_title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (currentVal != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(
                        '${widget.isEmail ? s.emailFieldLabel : s.phone}: $currentVal',
                        style: TextStyle(fontSize: 13, color: c.textSecondary),
                      ),
                    ),
                  TextField(
                    controller: _valueCtrl,
                    keyboardType: widget.isEmail ? TextInputType.emailAddress : TextInputType.phone,
                    decoration: InputDecoration(
                      labelText: _label,
                      prefixIcon: Icon(widget.isEmail ? Icons.email_outlined : Icons.phone_outlined),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(s.verifyViaTitle, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  // E-posta seçeneği — sadece salon e-postası varsa göster
                  if (_hasEmail)
                    _VerifyOption(
                      value: 'email',
                      selected: _verifyVia == 'email',
                      label: s.verifyViaEmail,
                      detail: widget.salon!.email!,
                      onTap: () => setState(() => _verifyVia = 'email'),
                    ),
                  // SMS seçeneği — sadece salon telefonu varsa göster
                  if (_hasPhone)
                    _VerifyOption(
                      value: 'sms',
                      selected: _verifyVia == 'sms',
                      label: s.verifyViaSms,
                      detail: widget.salon!.phone!,
                      onTap: () => setState(() => _verifyVia = 'sms'),
                    ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _sending ? null : _sendCode,
                      child: _sending
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : Text(s.sendCode),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _VerifyOption extends StatelessWidget {
  final String value;
  final bool selected;
  final String label;
  final String detail;
  final VoidCallback onTap;

  const _VerifyOption({
    required this.value,
    required this.selected,
    required this.label,
    required this.detail,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          children: [
            Container(
              width: 20, height: 20,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: selected ? AppColors.primary : c.textHint,
                  width: selected ? 6 : 2,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                Text(detail, style: TextStyle(fontSize: 11, color: c.textSecondary)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
