import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/route_names.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/extensions/error_extensions.dart';
import '../../../../core/l10n/app_strings.dart';
import '../providers/booking_provider.dart';
import '../widgets/bottom_buttons.dart';
import '../widgets/confirm_step.dart';
import '../widgets/date_time_step.dart';
import '../widgets/service_step.dart';
import '../widgets/staff_step.dart';
import '../widgets/step_indicator.dart';

class BookingScreen extends ConsumerStatefulWidget {
  final String salonId;

  const BookingScreen({super.key, required this.salonId});

  @override
  ConsumerState<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends ConsumerState<BookingScreen> {
  /// Ephemeral UI state: form alanı. Business state `BookingNotifier`'da.
  final _noteController = TextEditingController();

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  BookingNotifier _notifier() => ref.read(bookingProvider(widget.salonId).notifier);

  Future<void> _onNext() async {
    final notifier = _notifier();
    final state = ref.read(bookingProvider(widget.salonId)).asData?.value;
    if (state == null) return;

    if (state.step < 3) {
      notifier.nextStep();
      if (state.step + 1 == 2) await notifier.loadSlots();
      return;
    }

    final appointmentId = await notifier.submit(_noteController.text);
    if (appointmentId != null && mounted) _showSuccessDialog();
  }

  void _showSuccessDialog() {
    final s = S.of(context);
    final colors = AppColors.of(context);

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(color: colors.success, shape: BoxShape.circle),
                child: const Icon(Icons.check, size: 40, color: Colors.white),
              ),
              const SizedBox(height: 20),
              Text(
                s.bookingSuccessTitle,
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                s.bookingSuccessBody,
                style: TextStyle(color: colors.textSecondary, fontSize: 14),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.of(ctx).pop();
                    context.goNamed(RouteNames.appointments);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: colors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text(
                    s.bookingGoToAppointments,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                  ),
                ),
              ),
              TextButton(
                onPressed: () {
                  Navigator.of(ctx).pop();
                  context.goNamed(RouteNames.home);
                },
                child: Text(s.bookingBackHome),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _stepWidget(BookingState state) {
    switch (state.step) {
      case 0:
        return ServiceStep(state: state, onSelect: (i) => _notifier().selectService(i));
      case 1:
        return StaffStep(state: state, onSelect: (i) => _notifier().selectStaff(i));
      case 2:
        return DateTimeStep(
          state: state,
          onSelectDate: (d) => _notifier().setDate(d),
          onSelectTime: (t) => _notifier().selectTime(t),
          onLoadSlots: () => _notifier().loadSlots(),
        );
      case 3:
        return ConfirmStep(state: state, noteController: _noteController);
      default:
        return const SizedBox.shrink();
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);
    final bookingAsync = ref.watch(bookingProvider(widget.salonId));

    return bookingAsync.when(
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (e, _) => Scaffold(body: Center(child: Text('${s.error}: ${e.displayMessage}'))),
      data: (state) => Scaffold(
        backgroundColor: colors.background,
        appBar: AppBar(
          title: Text(s.bookingTitle),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.pop(),
          ),
        ),
        body: Column(
          children: [
            StepIndicator(state: state),
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 250),
                child: _stepWidget(state),
              ),
            ),
            if (state.step == 0 && state.service != null) ServiceBar(service: state.service!),
            if (state.step == 2) TimeSummaryBar(state: state),
            if (state.error != null)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                child: Text(
                  state.error!,
                  style: TextStyle(color: colors.error, fontSize: 13),
                ),
              ),
            BottomButtons(
              state: state,
              onNext: _onNext,
              onBack: () => _notifier().backStep(),
            ),
          ],
        ),
      ),
    );
  }
}
