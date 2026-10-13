import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/route_names.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/widgets/state_view.dart';
import '../../domain/entities/appointment.dart';
import '../providers/appointments_provider.dart';
import '../widgets/appointment_card.dart';

class AppointmentsScreen extends ConsumerStatefulWidget {
  const AppointmentsScreen({super.key});

  @override
  ConsumerState<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends ConsumerState<AppointmentsScreen>
    with SingleTickerProviderStateMixin {
  late TabController tabController;

  @override
  void initState() {
    super.initState();
    tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        title: Text(s.appointmentsTitle),
        bottom: TabBar(
          controller: tabController,
          labelColor: colors.primary,
          unselectedLabelColor: colors.textSecondary,
          indicatorColor: colors.primary,
          indicatorWeight: 3,
          labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          tabs: [
            Tab(text: s.appointmentsUpcoming),
            Tab(text: s.appointmentsPast),
            Tab(text: s.appointmentsCancelled),
          ],
        ),
      ),
      body: TabBarView(
        controller: tabController,
        children: [
          _buildAppointmentList('upcoming'),
          _buildAppointmentList('past'),
          _buildAppointmentList('cancelled'),
        ],
      ),
    );
  }

  Widget _buildAppointmentList(String type) {
    final s = S.of(context);
    final appointmentsAsync = ref.watch(appointmentsProvider);

    return appointmentsAsync.when(
      loading: () => const SkeletonList(count: 3, itemHeight: 90),
      error: (e, _) => ErrorState(
        message: '${s.appointmentsLoadFailed}: $e',
        onRetry: () => ref.read(appointmentsProvider.notifier).refresh(),
      ),
      data: (all) {
        final List<Appointment> items;
        if (type == 'upcoming') {
          items = all.where((a) => a.isUpcoming).toList();
        } else if (type == 'past') {
          items = all.where((a) => a.isPast).toList();
        } else {
          items = all.where((a) => a.isCancelled).toList();
        }

        if (items.isEmpty) {
          return EmptyState(
            message: type == 'upcoming'
                ? s.appointmentsNoUpcoming
                : type == 'past'
                    ? s.appointmentsNoPast
                    : s.appointmentsNoCancelled,
            icon: type == 'cancelled'
                ? Icons.cancel_outlined
                : Icons.calendar_today_outlined,
            actionLabel: type == 'upcoming' ? s.appointmentsExplore : null,
            onAction: type == 'upcoming'
                ? () => context.goNamed(RouteNames.discover)
                : null,
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(20),
          itemCount: items.length,
          itemBuilder: (context, index) {
            final a = items[index];
            return AppointmentCard(
              salonName: a.salon.name,
              serviceName: a.service?.name ?? '-',
              staffName: a.staff?.fullName ?? '-',
              date: a.formattedDate,
              time: a.formattedTime,
              status: a.status,
              onTap: () => context.pushNamed(RouteNames.salonDetail,
                  pathParameters: {'id': a.salon.id}),
              onCancel: type == 'upcoming' ? () => _showCancelDialog(a) : null,
              onReview: type == 'past' && a.status == 'COMPLETED'
                  ? () => context.pushNamed(RouteNames.writeReview,
                      pathParameters: {'appointmentId': a.id})
                  : null,
              onRebook: type == 'past'
                  ? () => context.pushNamed(RouteNames.booking,
                      pathParameters: {'salonId': a.salon.id})
                  : null,
            );
          },
        );
      },
    );
  }

  void _showCancelDialog(Appointment a) {
    final colors = AppColors.of(context);
    final s = S.of(context);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(s.appointmentsCancelTitle),
        content: Text('${a.salon.name} ${s.appointmentsCancelContent}'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(s.appointmentsCancelKeep),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await ref.read(appointmentsProvider.notifier).cancel(a.id);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(s.appointmentsCancelled2),
                    backgroundColor: colors.error,
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: colors.error),
            child: Text(s.appointmentsCancelDo,
                style: const TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
