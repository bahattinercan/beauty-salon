import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_theme_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/widgets/state_view.dart';
import '../../data/services_provider.dart';

class ServiceManagementScreen extends ConsumerWidget {
  const ServiceManagementScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = S.of(context);
    final c = context.colors;
    final servicesAsync = ref.watch(servicesProvider);

    return Scaffold(
      appBar: AppBar(title: Text(s.serviceManagement)),
      body: servicesAsync.when(
        loading: () => const SkeletonList(count: 4, itemHeight: 90),
        error: (e, _) => ErrorState(
          message: s.errorMsg('$e'),
          onRetry: () => ref.read(servicesProvider.notifier).refresh(),
        ),
        data: (services) {
          final grouped = <String, List<SalonService>>{};
          for (final svc in services) {
            final cat = svc.categoryName ?? s.otherCategory;
            grouped.putIfAbsent(cat, () => []).add(svc);
          }

          return RefreshIndicator(
            onRefresh: () => ref.read(servicesProvider.notifier).refresh(),
            child: services.isEmpty
                ? EmptyState(message: s.noServicesYet, icon: Icons.add_circle_outline)
                : ListView(
                    padding: const EdgeInsets.all(20),
                    children: grouped.entries.map((entry) {
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(entry.key, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(color: c.secondaryBg, borderRadius: BorderRadius.circular(10)),
                                child: Text('${entry.value.length}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primary)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          ...entry.value.map((service) => Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: _ServiceCard(
                                  service: service,
                                  onToggle: () => ref.read(servicesProvider.notifier).editService(service.id, {'isActive': !service.isActive}),
                                  onDelete: () => _confirmDelete(context, ref, service, s),
                                  onEdit: () => _showServiceForm(context, ref, existing: service),
                                ),
                              )),
                          const SizedBox(height: 8),
                        ],
                      );
                    }).toList(),
                  ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showServiceForm(context, ref),
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.add, color: Colors.white),
        label: Text(s.addService, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
      ),
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref, SalonService service, S s) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(s.deleteServiceTitle),
        content: Text(s.deleteServiceBody(service.name)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text(s.cancel)),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await ref.read(servicesProvider.notifier).delete(service.id);
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

  void _showServiceForm(BuildContext context, WidgetRef ref, {SalonService? existing}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _ServiceFormSheet(existing: existing, ref: ref),
    );
  }
}

class _ServiceCard extends StatelessWidget {
  final SalonService service;
  final VoidCallback onToggle;
  final VoidCallback onDelete;
  final VoidCallback onEdit;

  const _ServiceCard({required this.service, required this.onToggle, required this.onDelete, required this.onEdit});

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final c = context.colors;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: service.isActive ? c.surfaceVariant : AppColors.error.withValues(alpha: 0.2)),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(service.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                    if (!service.isActive) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(color: AppColors.error.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(4)),
                        child: Text(s.inactive, style: const TextStyle(fontSize: 10, color: AppColors.error, fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.access_time, size: 12, color: c.textSecondary),
                    const SizedBox(width: 3),
                    Text('${service.durationMinutes} ${s.minAbbr}', style: TextStyle(fontSize: 12, color: c.textSecondary)),
                    const SizedBox(width: 12),
                    Icon(Icons.attach_money, size: 12, color: c.textSecondary),
                    Text('${service.price.toStringAsFixed(0)} ₺', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primary)),
                  ],
                ),
                if (service.description != null && service.description!.trim().isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    service.description!.trim(),
                    style: TextStyle(fontSize: 12, color: c.textSecondary),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
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
              PopupMenuItem(value: 'toggle', child: Text(service.isActive ? s.setInactive : s.setActive)),
              PopupMenuItem(value: 'delete', child: Text(s.delete, style: const TextStyle(color: AppColors.error))),
            ],
          ),
        ],
      ),
    );
  }
}

class _ServiceFormSheet extends StatefulWidget {
  final SalonService? existing;
  final WidgetRef ref;
  const _ServiceFormSheet({this.existing, required this.ref});

  @override
  State<_ServiceFormSheet> createState() => _ServiceFormSheetState();
}

class _ServiceFormSheetState extends State<_ServiceFormSheet> {
  final _nameCtrl = TextEditingController();
  final _priceCtrl = TextEditingController();
  final _durationCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  String? _selectedCategoryId;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    if (widget.existing != null) {
      _nameCtrl.text = widget.existing!.name;
      _priceCtrl.text = widget.existing!.price.toStringAsFixed(0);
      _durationCtrl.text = '${widget.existing!.durationMinutes}';
      _descCtrl.text = widget.existing!.description ?? '';
      _selectedCategoryId = widget.existing!.categoryId;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose(); _priceCtrl.dispose(); _durationCtrl.dispose(); _descCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final c = context.colors;
    final categoriesAsync = widget.ref.watch(categoriesProvider);

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
                  Text(widget.existing == null ? s.addService : s.editServiceTitle,
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
                  TextField(controller: _nameCtrl, decoration: InputDecoration(labelText: s.serviceName, prefixIcon: const Icon(Icons.spa_outlined))),
                  const SizedBox(height: 14),
                  categoriesAsync.when(
                    loading: () => const SizedBox(),
                    error: (_, _) => const SizedBox(),
                    data: (cats) => DropdownButtonFormField<String>(
                      initialValue: _selectedCategoryId,
                      decoration: InputDecoration(labelText: s.category, prefixIcon: const Icon(Icons.category_outlined)),
                      items: cats.map((cat) => DropdownMenuItem(value: cat.id, child: Text(cat.name))).toList(),
                      onChanged: (v) => setState(() => _selectedCategoryId = v),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(child: TextField(controller: _durationCtrl, decoration: InputDecoration(labelText: s.durationMin, prefixIcon: const Icon(Icons.timer_outlined)), keyboardType: TextInputType.number)),
                      const SizedBox(width: 14),
                      Expanded(child: TextField(controller: _priceCtrl, decoration: InputDecoration(labelText: s.priceLabel, prefixIcon: const Icon(Icons.attach_money)), keyboardType: TextInputType.number)),
                    ],
                  ),
                  const SizedBox(height: 14),
                  TextField(controller: _descCtrl, decoration: InputDecoration(labelText: s.descriptionOptional), maxLines: 2),
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
      'name': _nameCtrl.text.trim(),
      if (_selectedCategoryId != null) 'categoryId': _selectedCategoryId,
      'durationMinutes': int.tryParse(_durationCtrl.text) ?? 30,
      'price': double.tryParse(_priceCtrl.text) ?? 0,
      if (_descCtrl.text.trim().isNotEmpty) 'description': _descCtrl.text.trim(),
    };
    try {
      if (widget.existing == null) {
        await widget.ref.read(servicesProvider.notifier).create(data);
      } else {
        await widget.ref.read(servicesProvider.notifier).editService(widget.existing!.id, data);
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
