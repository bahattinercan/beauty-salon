import 'dart:io';

import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';

/// Avatar + kamera rozeti. `pickedFile` seçilen dosyanın önizlemesi,
/// `avatarUrl` sunucudaki mevcut avatar; ikisi de yoksa initials gösterilir.
class AvatarPicker extends StatelessWidget {
  final String initials;
  final String? avatarUrl;
  final File? pickedFile;
  final bool uploading;
  final VoidCallback? onTap;

  const AvatarPicker({
    super.key,
    required this.initials,
    this.avatarUrl,
    this.pickedFile,
    this.uploading = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);

    final ImageProvider? image = pickedFile != null
        ? FileImage(pickedFile!)
        : (avatarUrl != null ? NetworkImage(avatarUrl!) : null);

    return Stack(
      children: [
        Container(
          width: 90,
          height: 90,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: colors.primaryGradient,
            boxShadow: [
              BoxShadow(
                color: colors.primary.withValues(alpha: 0.3),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
            image: image != null
                ? DecorationImage(image: image, fit: BoxFit.cover)
                : null,
          ),
          child: image != null
              ? null
              : Center(
                  child: Text(
                    initials,
                    style: const TextStyle(
                        fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ),
        ),
        if (uploading)
          Positioned(
            left: 33,
            top: 33,
            child: SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
            ),
          ),
        Positioned(
          bottom: 0,
          right: 0,
          child: Semantics(
            label: s.changeAvatar,
            button: true,
            child: GestureDetector(
              onTap: uploading ? null : onTap,
              child: Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: colors.primary,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                ),
                child: Icon(Icons.camera_alt, size: 14, color: Colors.white),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
