import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_theme_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/widgets/state_view.dart';
import '../../data/staff_provider.dart';
import '../../../services/data/services_provider.dart';

class StaffManagementScreen extends ConsumerWidget {
  const StaffManagementScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = S.of(context);
    final staffAsync = ref.watch(staffProvider);

    return Scaffold(
      appBar: AppBar(title: Text(s.teamManagement)),
      body: staffAsync.when(
        loading: () => const SkeletonList(count: 4, itemHeight: 90),
        error: (e, _) => ErrorState(
          message: s.errorMsg('$e'),
          onRetry: () => ref.read(staffProvider.notifier).refresh(),
        ),
        data: (list) => RefreshIndicator(
          onRefresh: () => ref.read(staffProvider.notifier).refresh(),
          child: list.isEmpty
              ? EmptyState(message: s.noStaffYet, icon: Icons.person_add_outlined)
              : ListView.builder(
                  padding: const EdgeInsets.all(20),
                  itemCount: list.length,
                  itemBuilder: (context, index) {
                    final person = list[index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 14),
                      child: _StaffCard(
                        staff: person,
                        onToggle: () => ref.read(staffProvider.notifier).editStaff(
                          person.id, {'isActive': !person.isActive},
                        ),
                        onDelete: () => _confirmDelete(context, ref, person, s),
                        onEdit: () => _showStaffForm(context, ref, existing: person),
                      ),
                    );
                  },
                ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showStaffForm(context, ref),
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.person_add, color: Colors.white),
        label: Text(s.addStaff, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
      ),
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref, StaffMember person, S s) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(s.deleteStaffTitle),
        content: Text(s.deleteStaffBody(person.fullName)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text(s.cancel)),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await ref.read(staffProvider.notifier).delete(person.id);
              } catch (e) {
                if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(s.errorMsg('$e')), backgroundColor: Colors.red));
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: Text(s.delete, style: const TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showStaffForm(BuildContext context, WidgetRef ref, {StaffMember? existing}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _StaffFormSheet(existing: existing),
    );
  }
}

class _StaffCard extends StatelessWidget {
  final StaffMember staff;
  final VoidCallback onToggle;
  final VoidCallback onDelete;
  final VoidCallback onEdit;

  const _StaffCard({required this.staff, required this.onToggle, required this.onDelete, required this.onEdit});

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final c = context.colors;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: staff.isActive ? c.surfaceVariant : AppColors.error.withValues(alpha: 0.2)),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 2))],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 52, height: 52,
                decoration: BoxDecoration(
                  gradient: staff.isActive ? AppColors.primaryGradient : null,
                  color: staff.isActive ? null : c.textHint,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Center(
                  child: Text(
                    staff.fullName.split(' ').map((e) => e[0].toUpperCase()).take(2).join(),
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(staff.fullName, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                        if (!staff.isActive) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(color: AppColors.error.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(4)),
                            child: Text(s.inactive, style: const TextStyle(fontSize: 10, color: AppColors.error, fontWeight: FontWeight.w600)),
                          ),
                        ],
                      ],
                    ),
                    if (staff.title != null) ...[
                      const SizedBox(height: 2),
                      Text(staff.title!, style: TextStyle(fontSize: 12, color: c.textSecondary)),
                    ],
                  ],
                ),
              ),
              PopupMenuButton<String>(
                onSelected: (v) {
                  if (v == 'edit') onEdit();
                  if (v == 'toggle') onToggle();
                  if (v == 'delete') onDelete();
                },
                itemBuilder: (_) => [
                  PopupMenuItem(value: 'edit', child: Text(s.edit)),
                  PopupMenuItem(value: 'toggle', child: Text(staff.isActive ? s.setInactive : s.setActive)),
                  PopupMenuItem(value: 'delete', child: Text(s.delete, style: const TextStyle(color: AppColors.error))),
                ],
              ),
            ],
          ),
          if (staff.serviceNames.isNotEmpty) ...[
            const SizedBox(height: 10),
            const Divider(height: 1),
            const SizedBox(height: 10),
            Wrap(
              spacing: 6, runSpacing: 4,
              children: staff.serviceNames.map((svc) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: c.secondaryBg, borderRadius: BorderRadius.circular(8)),
                child: Text(svc, style: const TextStyle(fontSize: 11, color: AppColors.primaryDark, fontWeight: FontWeight.w500)),
              )).toList(),
            ),
          ],
          if (staff.phone != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.phone_outlined, size: 14, color: c.textSecondary),
                const SizedBox(width: 4),
                Text(staff.phone!, style: TextStyle(fontSize: 12, color: c.textSecondary)),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _StaffFormSheet extends ConsumerStatefulWidget {
  final StaffMember? existing;
  const _StaffFormSheet({this.existing});

  @override
  ConsumerState<_StaffFormSheet> createState() => _StaffFormSheetState();
}

class _StaffFormSheetState extends ConsumerState<_StaffFormSheet> {
  final _nameCtrl = TextEditingController();
  final _titleCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final Set<String> _selectedServiceIds = {};
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    if (widget.existing != null) {
      _nameCtrl.text = widget.existing!.fullName;
      _titleCtrl.text = widget.existing!.title ?? '';
      _phoneCtrl.text = widget.existing!.phone ?? '';
      _emailCtrl.text = widget.existing!.email ?? '';
      _selectedServiceIds.addAll(widget.existing!.serviceIds);
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose(); _titleCtrl.dispose(); _phoneCtrl.dispose(); _emailCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final c = context.colors;
    final servicesAsync = ref.watch(servicesProvider);

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
                  Text(widget.existing == null ? s.addStaff : s.editStaffTitle,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                ],
              ),
            ),
            SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextField(controller: _nameCtrl, decoration: InputDecoration(labelText: s.fullName, prefixIcon: const Icon(Icons.person_outline))),
                  const SizedBox(height: 14),
                  TextField(controller: _titleCtrl, decoration: InputDecoration(labelText: s.title, prefixIcon: const Icon(Icons.work_outline))),
                  const SizedBox(height: 14),
                  TextField(controller: _phoneCtrl, decoration: InputDecoration(labelText: s.phone, prefixIcon: const Icon(Icons.phone_outlined)), keyboardType: TextInputType.phone),
                  const SizedBox(height: 14),
                  TextField(controller: _emailCtrl, decoration: InputDecoration(labelText: s.emailFieldLabel, prefixIcon: const Icon(Icons.email_outlined)), keyboardType: TextInputType.emailAddress),
                  const SizedBox(height: 20),
                  Text(s.servicesLabel, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: c.textSecondary)),
                  const SizedBox(height: 10),
                  servicesAsync.when(
                    loading: () => const Center(child: CircularProgressIndicator()),
                    error: (e, st) => const SizedBox.shrink(),
                    data: (services) => Wrap(
                      spacing: 8, runSpacing: 8,
                      children: services.where((svc) => svc.isActive).map((svc) {
                        final selected = _selectedServiceIds.contains(svc.id);
                        return GestureDetector(
                          onTap: () => setState(() {
                            if (selected) {
                              _selectedServiceIds.remove(svc.id);
                            } else {
                              _selectedServiceIds.add(svc.id);
                            }
                          }),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: selected ? AppColors.primary : c.surface,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: selected ? AppColors.primary : c.secondaryBorder),
                            ),
                            child: Text(svc.name, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: selected ? Colors.white : c.textSecondary)),
                          ),
                        );
                      }).toList(),
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

  Future<void> _save() async {
    if (_nameCtrl.text.trim().isEmpty) return;
    setState(() => _saving = true);
    final data = {
      'fullName': _nameCtrl.text.trim(),
      if (_titleCtrl.text.trim().isNotEmpty) 'title': _titleCtrl.text.trim(),
      if (_phoneCtrl.text.trim().isNotEmpty) 'phone': _phoneCtrl.text.trim(),
      if (_emailCtrl.text.trim().isNotEmpty) 'email': _emailCtrl.text.trim(),
      'serviceIds': _selectedServiceIds.toList(),
    };
    try {
      if (widget.existing == null) {
        await ref.read(staffProvider.notifier).create(data);
      } else {
        await ref.read(staffProvider.notifier).editStaff(widget.existing!.id, data);
      }
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        final s = S.of(context);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(s.errorMsg('$e')), backgroundColor: Colors.red));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}
