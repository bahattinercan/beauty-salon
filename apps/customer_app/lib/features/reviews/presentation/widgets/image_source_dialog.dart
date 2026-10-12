import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';

Future<ImageSource?> showImageSourceDialog(BuildContext context) {
  final colors = AppColors.of(context);
  final s = S.of(context);

  return showDialog<ImageSource>(
    context: context,
    builder: (ctx) => SimpleDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      children: [
        SimpleDialogOption(
          onPressed: () => Navigator.pop(ctx, ImageSource.camera),
          child: Row(
            children: [
              Icon(Icons.camera_alt, color: colors.primary),
              const SizedBox(width: 12),
              Text(s.reviewCamera, style: const TextStyle(fontSize: 15)),
            ],
          ),
        ),
        SimpleDialogOption(
          onPressed: () => Navigator.pop(ctx, ImageSource.gallery),
          child: Row(
            children: [
              Icon(Icons.photo_library, color: colors.primary),
              const SizedBox(width: 12),
              Text(s.reviewGallery, style: const TextStyle(fontSize: 15)),
            ],
          ),
        ),
      ],
    ),
  );
}
