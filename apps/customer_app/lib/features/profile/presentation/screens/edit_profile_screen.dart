import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/utils/snackbar.dart';
import '../providers/user_provider.dart';
import '../widgets/app_text_field.dart';
import '../widgets/avatar_upload_section.dart';
import '../widgets/change_password_tile.dart';
import '../widgets/email_change_section.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _emailController;
  late final TextEditingController _phoneController;
  String _originalEmail = '';
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(userProvider).asData?.value;
    _nameController = TextEditingController(text: user?.fullName ?? '');
    _emailController = TextEditingController(text: user?.email ?? '');
    _phoneController = TextEditingController(text: user?.phone ?? '');
    _originalEmail = user?.email ?? '';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    final s = S.of(context);
    setState(() => _isSaving = true);

    final result = await ref.read(userProvider.notifier).updateProfile(
          fullName: _nameController.text.trim(),
          phone: _phoneController.text.trim(),
        );

    if (!mounted) return;
    setState(() => _isSaving = false);

    result.fold(
      (failure) => showAppSnackBar(
        context,
        failure.message.isEmpty ? s.editProfileError : failure.message,
        isError: true,
      ),
      (_) {
        showAppSnackBar(context, s.editProfileSaved);
        Navigator.pop(context);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);
    final name = _nameController.text.trim();
    final initials = name.isEmpty
        ? '?'
        : name.split(' ').map((w) => w.substring(0, 1)).join().toUpperCase();

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        title: Text(s.profileEdit),
        actions: [
          TextButton(
            onPressed: _isSaving ? null : _save,
            child: _isSaving
                ? SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: colors.primary),
                  )
                : Text(s.save,
                    style: TextStyle(
                        color: colors.primary, fontWeight: FontWeight.w600, fontSize: 15)),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              const SizedBox(height: 8),
              AvatarUploadSection(initials: initials),
              const SizedBox(height: 32),
              AppTextField(
                controller: _nameController,
                label: s.fullNameLabel,
                icon: Icons.person_outline,
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return s.nameRequired;
                  if (v.trim().length < 3) return s.nameMin3;
                  return null;
                },
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: _emailController,
                label: s.emailLabel,
                icon: Icons.email_outlined,
                keyboardType: TextInputType.emailAddress,
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return s.emailRequiredField;
                  if (!v.contains('@') || !v.contains('.')) return s.emailInvalidField;
                  return null;
                },
              ),
              EmailChangeSection(
                emailController: _emailController,
                originalEmail: _originalEmail,
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: _phoneController,
                label: s.phoneLabel,
                icon: Icons.phone_outlined,
                keyboardType: TextInputType.phone,
                validator: (v) =>
                    (v == null || v.trim().isEmpty) ? s.phoneRequired : null,
              ),
              const SizedBox(height: 32),
              const ChangePasswordTile(),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _save,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: colors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _isSaving
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : Text(s.saveChanges,
                          style: const TextStyle(
                              fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
