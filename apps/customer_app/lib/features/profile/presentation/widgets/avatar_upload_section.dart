import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../../../core/di/injection.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/services/image_picker_service.dart';
import '../../../../core/utils/snackbar.dart';
import '../../../uploads/domain/usecases/upload_files_usecase.dart';
import '../../domain/usecases/update_profile_usecase.dart';
import '../providers/user_provider.dart';
import 'avatar_picker.dart';

/// Avatar seçimi + yükleme + profil güncelleme.
/// Hata handling `fold` ile: presentation'da `try/catch` yok (CLAUDE.md §3).
class AvatarUploadSection extends ConsumerStatefulWidget {
  const AvatarUploadSection({super.key, required this.initials});

  final String initials;

  @override
  ConsumerState<AvatarUploadSection> createState() => _AvatarUploadSectionState();
}

class _AvatarUploadSectionState extends ConsumerState<AvatarUploadSection> {
  File? _pickedFile;
  bool _isUploading = false;

  Future<void> _pickAndUpload() async {
    final s = S.of(context);

    final picked = await getIt<ImagePickerService>().pickImage(
      ImageSource.gallery,
      maxSize: 512,
      quality: 90,
    );
    if (!mounted) return;

    final file = picked.fold<File?>(
      (failure) {
        showAppSnackBar(context, '${s.imageUploadError}: ${failure.message}', isError: true);
        return null;
      },
      (f) => f,
    );
    if (file == null) return;

    setState(() {
      _pickedFile = file;
      _isUploading = true;
    });

    final uploaded = await getIt<UploadFilesUseCase>()([file.path]);
    if (!mounted) return;

    final url = uploaded.fold<String?>(
      (failure) {
        setState(() => _isUploading = false);
        showAppSnackBar(context, '${s.imageUploadError}: ${failure.message}', isError: true);
        return null;
      },
      (urls) => urls.isEmpty ? null : urls.first,
    );
    if (url == null) return;

    final result = await getIt<UpdateProfileUseCase>()(avatarUrl: url);
    if (!mounted) return;
    setState(() => _isUploading = false);

    result.fold(
      (failure) => showAppSnackBar(
        context,
        failure.message.isEmpty ? s.editProfileError : failure.message,
        isError: true,
      ),
      (_) => showAppSnackBar(context, s.editProfileSaved),
    );
  }

  @override
  Widget build(BuildContext context) {
    final avatarUrl = ref.watch(userProvider).asData?.value?.avatarUrl;

    return AvatarPicker(
      initials: widget.initials,
      avatarUrl: avatarUrl,
      pickedFile: _pickedFile,
      uploading: _isUploading,
      onTap: _isUploading ? null : _pickAndUpload,
    );
  }
}
