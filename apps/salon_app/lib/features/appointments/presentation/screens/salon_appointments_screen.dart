import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:table_calendar/table_calendar.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_theme_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/widgets/state_view.dart';
import '../../data/appointments_provider.dart';

class SalonAppointmentsScreen extends ConsumerStatefulWidget {
  const SalonAppointmentsScreen({super.key});

  @override
  ConsumerState<SalonAppointmentsScreen> createState() => _SalonAppointmentsScreenState();
}

class _SalonAppointmentsScreenState extends ConsumerState<SalonAppointmentsScreen> {
  DateTime _focusedDay = DateTime.now();
  DateTime _selectedDay = DateTime.now();
  CalendarFormat _calendarFormat = CalendarFormat.week;
  String? _statusFilter;

  String get _selectedDateStr {
    final d = _selectedDay;
    return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final c = context.colors;
    final apptAsync = ref.watch(salonAppointmentsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(s.appointmentsTitle),
        actions: [
          IconButton(
            icon: Icon(_calendarFormat == CalendarFormat.week ? Icons.calendar_view_month : Icons.calendar_view_week),
            onPressed: () => setState(() {
              _calendarFormat = _calendarFormat == CalendarFormat.week ? CalendarFormat.month : CalendarFormat.week;
            }),
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            color: c.surface,
            child: TableCalendar(
              firstDay: DateTime.now().subtract(const Duration(days: 365)),
              lastDay: DateTime.now().add(const Duration(days: 365)),
              focusedDay: _focusedDay,
              selectedDayPredicate: (day) => isSameDay(_selectedDay, day),
              calendarFormat: _calendarFormat,
              locale: s.isEn ? 'en_US' : 'tr_TR',
              headerStyle: const HeaderStyle(
                formatButtonVisible: false,
                titleCentered: true,
                titleTextStyle: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
              calendarStyle: CalendarStyle(
                selectedDecoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                todayDecoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.2), shape: BoxShape.circle),
                todayTextStyle: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600),
              ),
              onDaySelected: (selectedDay, focusedDay) {
                setState(() {
                  _selectedDay = selectedDay;
                  _focusedDay = focusedDay;
                });
                ref.read(salonAppointmentsProvider.notifier).refresh(date: _selectedDateStr, status: _statusFilter);
              },
              onFormatChanged: (format) => setState(() => _calendarFormat = format),
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                apptAsync.when(
                  data: (list) {
                    final filtered = _filterList(list);
                    return Text(s.appointmentCount(filtered.length),
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600));
                  },
                  loading: () => const Skeleton(width: 120, height: 20),
                  error: (_, _) => const SizedBox(),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
            child: Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                _filterChip(s.all, null, c),
                _filterChip(s.filterPending, 'PENDING', c),
                _filterChip(s.filterConfirmed, 'CONFIRMED', c),
                _filterChip(s.filterCompleted, 'COMPLETED', c),
                _filterChip(s.filterCancelled, 'CANCELLED', c),
                _filterChip(s.filterNoShow, 'NO_SHOW', c),
              ],
            ),
          ),
          Expanded(
            child: apptAsync.when(
              loading: () => const SkeletonList(count: 4, itemHeight: 90),
              error: (e, _) => ErrorState(
                message: s.errorMsg('$e'),
                onRetry: () => ref.read(salonAppointmentsProvider.notifier).refresh(),
              ),
              data: (list) {
                final filtered = _filterList(list);
                if (filtered.isEmpty) {
                  return EmptyState(
                    message: s.noAppointmentsForDate,
                    icon: Icons.calendar_today_outlined,
                  );
                }
                return RefreshIndicator(
                  onRefresh: () => ref.read(salonAppointmentsProvider.notifier)
                      .refresh(date: _selectedDateStr, status: _statusFilter),
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final apt = filtered[index];
                      return _AppointmentTile(
                        appointment: apt,
                        onConfirm: apt.status == 'PENDING' ? () => _updateStatus(apt.id, 'CONFIRMED') : null,
                        onComplete: apt.status == 'CONFIRMED' ? () => _updateStatus(apt.id, 'COMPLETED') : null,
                        onNoShow: apt.status == 'CONFIRMED' ? () => _updateStatus(apt.id, 'NO_SHOW') : null,
                        onCancel: (apt.status == 'PENDING' || apt.status == 'CONFIRMED')
                            ? () => _showCancelDialog(apt.id, apt.customerName)
                            : null,
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  List<SalonAppointment> _filterList(List<SalonAppointment> list) {
    final dateFiltered = list.where((a) => a.date == _selectedDateStr).toList();
    if (_statusFilter == null) return dateFiltered;
    return dateFiltered.where((a) => a.status == _statusFilter).toList();
  }

  Widget _filterChip(String label, String? status, AppThemeColors c) {
    final isSelected = _statusFilter == status;
    return GestureDetector(
      onTap: () => setState(() => _statusFilter = status),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : c.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isSelected ? AppColors.primary : c.secondaryBorder),
        ),
        child: Text(label,
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: isSelected ? Colors.white : c.textSecondary)),
      ),
    );
  }

  void _updateStatus(String id, String newStatus) async {
    final s = S.of(context);
    try {
      await ref.read(salonAppointmentsProvider.notifier).updateStatus(id, newStatus);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(switch (newStatus) {
            'CONFIRMED' => s.appointmentConfirmed,
            'NO_SHOW' => s.appointmentNoShow,
            _ => s.appointmentCompleted,
          })),
        );
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(s.errorMsg('$e')), backgroundColor: Colors.red));
    }
  }

  void _showCancelDialog(String id, String customerName) {
    final s = S.of(context);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(s.cancelAppointmentTitle),
        content: Text(s.cancelAppointmentBody(customerName)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text(s.dismiss)),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await ref.read(salonAppointmentsProvider.notifier).cancel(id);
                if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(s.appointmentCancelled), backgroundColor: AppColors.error));
              } catch (e) {
                if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(s.errorMsg('$e')), backgroundColor: Colors.red));
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: Text(s.cancelAction, style: const TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}

class _AppointmentTile extends StatelessWidget {
  final SalonAppointment appointment;
  final VoidCallback? onConfirm;
  final VoidCallback? onCancel;
  final VoidCallback? onComplete;
  final VoidCallback? onNoShow;

  const _AppointmentTile({
    required this.appointment,
    this.onConfirm,
    this.onCancel,
    this.onComplete,
    this.onNoShow,
  });

  @override
  Widget build(BuildContext context) {
    final s = S.of(context);
    final c = context.colors;
    final isPending = appointment.status == 'PENDING';
    final isConfirmed = appointment.status == 'CONFIRMED';

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: c.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: isPending ? AppColors.warning.withValues(alpha: 0.4) : c.surfaceVariant),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        child: Column(
          children: [
            Row(
              children: [
                Column(
                  children: [
                    Text(appointment.startTime, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primary)),
                    Text(appointment.endTime, style: TextStyle(fontSize: 12, color: c.textSecondary)),
                  ],
                ),
                const SizedBox(width: 14),
                Container(width: 2, height: 40, decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.3), borderRadius: BorderRadius.circular(1))),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(appointment.customerName, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 2),
                      Text(
                        '${appointment.serviceName}${appointment.staffName != null ? ' • ${appointment.staffName}' : ''}',
                        style: TextStyle(fontSize: 12, color: c.textSecondary),
                      ),
                    ],
                  ),
                ),
                _statusBadge(s),
              ],
            ),
            if (isPending || isConfirmed) ...[
              const SizedBox(height: 10),
              const Divider(height: 1),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (onConfirm != null) _actionBtn(s.confirm, Icons.check, AppColors.success, onConfirm!),
                  if (onComplete != null) _actionBtn(s.complete, Icons.done_all, AppColors.info, onComplete!),
                  if (onNoShow != null) _actionBtn(s.markNoShow, Icons.person_off_outlined, AppColors.warning, onNoShow!),
                  if (onCancel != null) _actionBtn(s.cancel, Icons.close, AppColors.error, onCancel!),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _statusBadge(S s) {
    Color color;
    String label;
    switch (appointment.status) {
      case 'CONFIRMED': color = AppColors.success; label = s.statusConfirmed;
      case 'PENDING': color = AppColors.warning; label = s.statusPending;
      case 'COMPLETED': color = AppColors.info; label = s.statusCompleted;
      case 'CANCELLED': color = AppColors.error; label = s.statusCancelled;
      default: color = const Color(0xFF757575); label = appointment.status;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(6)),
      child: Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: color)),
    );
  }

  Widget _actionBtn(String label, IconData icon, Color color, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(left: 8),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
          child: Row(
            children: [
              Icon(icon, size: 14, color: color),
              const SizedBox(width: 4),
              Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: color)),
            ],
          ),
        ),
      ),
    );
  }
}
