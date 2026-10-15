import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_theme_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../salon/data/salon_provider.dart';
import '../../../dashboard/data/dashboard_provider.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = S.of(context);
    final c = context.colors;
    final salonAsync = ref.watch(salonProvider);
    final dashAsync = ref.watch(dashboardProvider);

    return Scaffold(
      backgroundColor: c.background,
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () => ref.read(dashboardProvider.notifier).refresh(),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            _GradientHeader(salonAsync: salonAsync, s: s),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  dashAsync.when(
                    loading: () => _StatsShimmer(),
                    error: (e, _) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      child: Text(s.errorMsg('$e'), style: const TextStyle(color: AppColors.error)),
                    ),
                    data: (data) => Column(
                      children: [
                        Row(children: [
                          Expanded(child: _StatCard(title: s.today, value: '${data.todayCount}', subtitle: s.appointment, icon: Icons.calendar_today_rounded, gradient: const LinearGradient(colors: [Color(0xFF9B7FE0), Color(0xFF6644B8)], begin: Alignment.topLeft, end: Alignment.bottomRight))),
                          const SizedBox(width: 12),
                          Expanded(child: _StatCard(title: s.thisWeek, value: '${data.weekCount}', subtitle: s.appointment, icon: Icons.date_range_rounded, gradient: const LinearGradient(colors: [Color(0xFF5B8DEF), Color(0xFF3D6FD4)], begin: Alignment.topLeft, end: Alignment.bottomRight))),
                        const SizedBox(width: 12),
                        Expanded(child: _StatCard(title: s.isEn ? 'Today Revenue' : 'Günlük Gelir', value: '${data.monthRevenue.toStringAsFixed(0)} ₺', subtitle: s.appointment, icon: Icons.attach_money_rounded, gradient: const LinearGradient(colors: [Color(0xFF4CAF7D), Color(0xFF2E8A5A)], begin: Alignment.topLeft, end: Alignment.bottomRight))),
                        ]),
                        const SizedBox(height: 12),
                        Row(children: [
                          Expanded(child: _StatCard(title: s.average, value: data.avgRating.toStringAsFixed(1), subtitle: s.rating, icon: Icons.star_rounded, gradient: const LinearGradient(colors: [Color(0xFFFFB547), Color(0xFFE8900A)], begin: Alignment.topLeft, end: Alignment.bottomRight))),
                          const SizedBox(width: 12),
                          Expanded(child: _StatCard(title: s.totalReviews, value: '${salonAsync.asData?.value?.reviewCount ?? 0}', subtitle: s.total, icon: Icons.reviews_rounded, gradient: const LinearGradient(colors: [Color(0xFF4CAF7D), Color(0xFF2E8A5A)], begin: Alignment.topLeft, end: Alignment.bottomRight))),
                        ]),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),
                  Text(s.weeklyChart, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700, color: c.background == const Color(0xFFFAFAFC) ? AppColors.textPrimary : Colors.white)),
                  const SizedBox(height: 12),
                  dashAsync.when(
                    loading: () => Container(height: 200, decoration: BoxDecoration(color: c.surface, borderRadius: BorderRadius.circular(20))),
                    error: (_, _) => const SizedBox(height: 200),
                    data: (data) => Container(
                      height: 200,
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                      decoration: BoxDecoration(
                        color: c.surface,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.08), blurRadius: 20, offset: const Offset(0, 4))],
                      ),
                      child: BarChart(BarChartData(
                        barGroups: List.generate(7, (i) => _makeBarGroup(i, data.weeklyChart[i].toDouble())),
                        borderData: FlBorderData(show: false),
                        gridData: FlGridData(
                          show: true,
                          drawVerticalLine: false,
                          getDrawingHorizontalLine: (_) => FlLine(color: c.surfaceVariant, strokeWidth: 1),
                        ),
                        titlesData: FlTitlesData(
                          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          bottomTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              getTitlesWidget: (value, meta) {
                                final days = s.dayAbbreviations;
                                return Padding(
                                  padding: const EdgeInsets.only(top: 8),
                                  child: Text(days[value.toInt()], style: TextStyle(fontSize: 11, color: c.textSecondary, fontWeight: FontWeight.w500)),
                                );
                              },
                            ),
                          ),
                        ),
                      )),
                    ),
                  ),
                  const SizedBox(height: 28),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(s.todayAppointments, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                      TextButton(
                        onPressed: () => context.go('/appointments'),
                        child: Text(s.all, style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  dashAsync.when(
                    loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
                    error: (e, _) => Text(s.errorMsg('$e')),
                    data: (data) => data.todayAppointments.isEmpty
                        ? _EmptyState(message: s.noAppointmentsToday, c: c)
                        : Column(
                            children: data.todayAppointments
                                .map((a) => Padding(padding: const EdgeInsets.only(bottom: 10), child: _AppointmentTile(appointment: a, s: s)))
                                .toList(),
                          ),
                  ),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  BarChartGroupData _makeBarGroup(int x, double y) => BarChartGroupData(
    x: x,
    barRods: [
      BarChartRodData(
        toY: y,
        gradient: const LinearGradient(colors: [Color(0xFF9B7FE0), Color(0xFF6644B8)], begin: Alignment.bottomCenter, end: Alignment.topCenter),
        width: 22,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
      ),
    ],
  );
}

class _GradientHeader extends StatelessWidget {
  final AsyncValue<SalonInfo?> salonAsync;
  final S s;
  const _GradientHeader({required this.salonAsync, required this.s});

  @override
  Widget build(BuildContext context) {
    final salon = salonAsync.asData?.value;
    return SliverToBoxAdapter(
      child: Container(
        decoration: const BoxDecoration(
          gradient: AppColors.headerGradient,
          borderRadius: BorderRadius.vertical(bottom: Radius.circular(28)),
        ),
        padding: EdgeInsets.only(
          top: MediaQuery.of(context).padding.top + 20,
          left: 20,
          right: 20,
          bottom: 28,
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(s.helloOwner, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: Colors.white)),
                  const SizedBox(height: 4),
                  Text(salon?.name ?? '...', style: const TextStyle(fontSize: 14, color: Colors.white70)),
                ],
              ),
            ),
            Container(
              width: 44, height: 44,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(Icons.notifications_outlined, color: Colors.white, size: 22),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final String message;
  final AppThemeColors c;
  const _EmptyState({required this.message, required this.c});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 32),
      child: Column(
        children: [
          Container(
            width: 64, height: 64,
            decoration: BoxDecoration(color: AppColors.secondary, borderRadius: BorderRadius.circular(20)),
            child: const Icon(Icons.event_available_rounded, size: 32, color: AppColors.primary),
          ),
          const SizedBox(height: 12),
          Text(message, style: TextStyle(color: c.textSecondary, fontSize: 14)),
        ],
      ),
    );
  }
}

class _AppointmentTile extends StatelessWidget {
  final DashboardAppointment appointment;
  final S s;
  const _AppointmentTile({required this.appointment, required this.s});

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final (color, bgColor, label) = switch (appointment.status) {
      'COMPLETED' => (AppColors.success, AppColors.success.withValues(alpha: 0.12), s.statusLabel('COMPLETED')),
      'CONFIRMED' => (AppColors.primary, AppColors.primary.withValues(alpha: 0.12), s.statusLabel('CONFIRMED')),
      _ => (AppColors.warning, AppColors.warning.withValues(alpha: 0.12), s.statusLabel(appointment.status)),
    };

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.06), blurRadius: 12, offset: const Offset(0, 3))],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFFF0EBF8), Color(0xFFE3D8F5)], begin: Alignment.topLeft, end: Alignment.bottomRight),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(appointment.startTime, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.primary)),
          ),
          const SizedBox(width: 12),
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
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(8)),
            child: Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
          ),
        ],
      ),
    );
  }
}

class _StatsShimmer extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Column(children: [
      Row(children: [Expanded(child: _box(c)), const SizedBox(width: 12), Expanded(child: _box(c))]),
      const SizedBox(height: 12),
      Row(children: [Expanded(child: _box(c)), const SizedBox(width: 12), Expanded(child: _box(c))]),
    ]);
  }

  Widget _box(AppThemeColors c) => Container(
    height: 90,
    decoration: BoxDecoration(color: c.surfaceVariant, borderRadius: BorderRadius.circular(16)),
  );
}

class _StatCard extends StatelessWidget {
  final String title, value, subtitle;
  final IconData icon;
  final LinearGradient gradient;
  const _StatCard({required this.title, required this.value, required this.subtitle, required this.icon, required this.gradient});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: gradient,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: gradient.colors.first.withValues(alpha: 0.3), blurRadius: 12, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text(
                    title,
                    maxLines: 1,
                    style: const TextStyle(fontSize: 12, color: Colors.white70, fontWeight: FontWeight.w500),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                width: 32, height: 32,
                decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(10)),
                child: Icon(icon, size: 16, color: Colors.white),
              ),
            ],
          ),
          const SizedBox(height: 10),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(value, style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: Colors.white)),
          ),
          Text(subtitle, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: Colors.white70)),
        ],
      ),
    );
  }
}
