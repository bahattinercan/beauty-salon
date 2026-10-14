import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../domain/entities/salon_detail.dart';
import 'gallery_strip.dart';

class InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color? color;

  const InfoRow({super.key, required this.icon, required this.text, this.color});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);

    return Row(
      children: [
        Icon(icon, size: 16, color: color ?? colors.textSecondary),
        const SizedBox(width: 4),
        Expanded(
          child: Text(
            text,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: color ?? colors.textSecondary,
                  fontWeight: color != null ? FontWeight.w500 : FontWeight.normal,
                ),
          ),
        ),
      ],
    );
  }
}

class ActionChipWidget extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback? onTap;

  const ActionChipWidget({super.key, required this.icon, required this.label, this.onTap});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: colors.secondary,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          children: [
            Icon(icon, size: 16, color: colors.primary),
            const SizedBox(width: 6),
            Text(label,
                style: TextStyle(
                    color: colors.primary, fontWeight: FontWeight.w500, fontSize: 13)),
          ],
        ),
      ),
    );
  }
}

class SalonInfoSection extends StatelessWidget {
  final SalonDetail salon;

  const SalonInfoSection({super.key, required this.salon});

  /// Koordinat varsa konuma, yoksa ad + adres aramasına gider.
  static String _mapsQuery(SalonDetail salon) => salon.latitude != null && salon.longitude != null
      ? '${salon.latitude},${salon.longitude}'
      : Uri.encodeComponent('${salon.name}, ${salon.address}');

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);

    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    salon.name,
                    style: Theme.of(context)
                        .textTheme
                        .headlineSmall
                        ?.copyWith(fontWeight: FontWeight.bold),
                  ),
                ),
                if (salon.priceRangeLabel.isNotEmpty) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    margin: const EdgeInsets.only(right: 8),
                    decoration: BoxDecoration(
                      color: colors.secondary,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      salon.priceRangeLabel,
                      style: TextStyle(
                        color: colors.primary,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        // ₺ glifleri küçük puntoda birbirine değiyor.
                        letterSpacing: 1.5,
                      ),
                    ),
                  ),
                ],
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: colors.accent,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.star, color: Colors.white, size: 16),
                      const SizedBox(width: 4),
                      Text(
                        (salon.ratingAvg > 0 || salon.reviewCount > 0)
                            ? salon.ratingAvg.toStringAsFixed(1)
                            : s.salonNew,
                        style: const TextStyle(
                            color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            InfoRow(
              icon: Icons.location_on_outlined,
              text: '${salon.address}${salon.district != null ? ', ${salon.district}' : ''}',
            ),
            const SizedBox(height: 4),
            InfoRow(
              icon: Icons.access_time_outlined,
              text: '${s.salonToday}: ${salon.todayHours ?? s.closed}',
              color: colors.success,
            ),
            if (salon.phone != null) ...[
              const SizedBox(height: 4),
              InfoRow(icon: Icons.phone_outlined, text: salon.phone!),
            ],
            if (salon.description != null && salon.description!.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(
                salon.description!,
                style: TextStyle(color: colors.textSecondary, fontSize: 14, height: 1.4),
              ),
            ],
            if (salon.galleryImages.isNotEmpty) ...[
              const SizedBox(height: 16),
              GalleryStrip(images: salon.galleryImages),
            ],
            const SizedBox(height: 16),
            Row(
              children: [
                ActionChipWidget(
                  icon: Icons.phone,
                  label: s.salonCall,
                  onTap: salon.phone != null
                      ? () => launchUrl(Uri.parse('tel:${salon.phone}'))
                      : null,
                ),
                const SizedBox(width: 8),
                ActionChipWidget(
                  icon: Icons.directions,
                  label: s.salonDirections,
                  onTap: () => launchUrl(
                    Uri.parse('https://www.google.com/maps/search/?api=1&query=${_mapsQuery(salon)}'),
                    mode: LaunchMode.externalApplication,
                  ),
                ),
                const SizedBox(width: 8),
                ActionChipWidget(
                  icon: Icons.share,
                  label: s.salonShare,
                  onTap: () => Share.share('${salon.name}\n${salon.address}'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
