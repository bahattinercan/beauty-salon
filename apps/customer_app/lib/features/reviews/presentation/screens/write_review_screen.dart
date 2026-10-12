import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/di/injection.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/services/image_picker_service.dart';
import '../../../appointments/presentation/providers/appointments_provider.dart';
import '../../../uploads/domain/usecases/upload_files_usecase.dart';
import '../../domain/usecases/create_review_usecase.dart';
import '../widgets/image_source_dialog.dart';
import '../widgets/photo_picker_row.dart';
import '../widgets/rating_selector.dart';
import '../widgets/salon_info_card.dart';
import '../widgets/submit_bar.dart';
import '../widgets/success_dialog.dart';

class WriteReviewScreen extends ConsumerStatefulWidget {
  final String appointmentId;

  const WriteReviewScreen({super.key, required this.appointmentId});

  @override
  ConsumerState<WriteReviewScreen> createState() => _WriteReviewScreenState();
}

class _WriteReviewScreenState extends ConsumerState<WriteReviewScreen> {
  int _rating = 0;
  final _commentController = TextEditingController();
  final List<File> _selectedImages = [];
  bool _isSubmitting = false;

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    if (_selectedImages.length >= 4) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(S.of(context).reviewMaxPhotos)),
      );
      return;
    }

    final source = await showImageSourceDialog(context);
    if (source == null) return;

    final result = await getIt<ImagePickerService>().pickImage(source);
    if (!mounted) return;

    result.fold(
      (failure) => ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${S.of(context).imageUploadError}: ${failure.message}')),
      ),
      (file) => setState(() => _selectedImages.add(file)),
    );
  }

  Future<void> _submitReview() async {
    final s = S.of(context);

    setState(() => _isSubmitting = true);

    List<String> imageUrls = const <String>[];
    if (_selectedImages.isNotEmpty) {
      final uploadResult = await getIt<UploadFilesUseCase>()(
        _selectedImages.map((f) => f.path).toList(),
      );
      if (!mounted) return;

      final uploaded = uploadResult.fold<List<String>?>(
        (failure) {
          setState(() => _isSubmitting = false);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('${s.imageUploadError}: ${failure.message}')),
          );
          return null;
        },
        (urls) => urls,
      );
      if (uploaded == null) return;
      imageUrls = uploaded;
    }

    final comment = _commentController.text.trim();
    final result = await getIt<CreateReviewUseCase>()(
      appointmentId: widget.appointmentId,
      rating: _rating,
      comment: comment.isEmpty ? null : comment,
      images: imageUrls.isNotEmpty ? imageUrls : null,
    );

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    result.fold(
      (failure) => ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${s.reviewSubmitFailed}: ${failure.message}')),
      ),
      (_) => showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => ReviewSuccessDialog(
          onOk: () {
            Navigator.of(ctx).pop();
            context.pop();
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);
    final appointment = ref
        .watch(appointmentsProvider)
        .asData
        ?.value
        .where((a) => a.id == widget.appointmentId)
        .firstOrNull;

    final subtitle = [
      if (appointment?.service != null) appointment!.service!.name,
      if (appointment?.date != null) appointment!.formattedDate,
    ].join('  •  ');

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        title: Text(s.appointmentsReview),
        leading: IconButton(icon: const Icon(Icons.close), onPressed: () => context.pop()),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SalonInfoCard(
              title: appointment?.salon.name ?? '—',
              subtitle: subtitle,
            ),
            const SizedBox(height: 28),
            RatingSelector(rating: _rating, onChanged: (v) => setState(() => _rating = v)),
            const SizedBox(height: 28),
            Text(
              s.reviewCommentLabel,
              style: Theme.of(context)
                  .textTheme
                  .titleSmall
                  ?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _commentController,
              maxLines: 5,
              maxLength: 500,
              decoration: InputDecoration(
                hintText: s.reviewCommentHint,
                hintStyle: TextStyle(color: colors.textHint),
                filled: true,
                fillColor: colors.surface,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: colors.secondaryDark),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: colors.secondaryDark),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: colors.primary),
                ),
              ),
            ),
            const SizedBox(height: 20),
            PhotoPickerRow(
              images: _selectedImages,
              onAdd: _pickImage,
              onRemove: (i) => setState(() => _selectedImages.removeAt(i)),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
      bottomNavigationBar: SubmitBar(
        label: s.reviewSubmit,
        enabled: _rating > 0,
        isLoading: _isSubmitting,
        onPressed: _submitReview,
      ),
    );
  }
}
