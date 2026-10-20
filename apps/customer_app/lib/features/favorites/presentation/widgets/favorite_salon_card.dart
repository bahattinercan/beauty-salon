import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/network/media_url.dart';

class FavoriteSalonCard extends StatelessWidget {
  final String name;
  final String address;
  final double rating;
  final int reviewCount;
  final String? imageUrl;
  final VoidCallback onTap;
  final VoidCallback onRemove;

  const FavoriteSalonCard({super.key, 
    required this.name,
    required this.address,
    required this.rating,
    required this.reviewCount,
    this.imageUrl,
    required this.onTap,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            color: colors.surface,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(color: colors.shadowRaised, blurRadius: 16, offset: const Offset(0, 4)),
            ],
          ),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.horizontal(left: Radius.circular(16)),
                child: imageUrl != null && imageUrl!.isNotEmpty
                    ? Image.network(
                        resolveMediaUrl(imageUrl),
                        width: 110,
                        height: 130,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => _placeholder(colors),
                      )
                    : _placeholder(colors),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              name,
                              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          GestureDetector(
                            onTap: onRemove,
                            child: Icon(Icons.favorite, size: 22, color: colors.primary),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(Icons.place_outlined, size: 13, color: colors.textSecondary),
                          const SizedBox(width: 3),
                          Expanded(
                            child: Text(
                              address,
                              style: TextStyle(fontSize: 12, color: colors.textSecondary),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(color: colors.accent, borderRadius: BorderRadius.circular(4)),
                            child: Row(
                              children: [
                                const Icon(Icons.star, size: 12, color: Colors.white),
                                const SizedBox(width: 2),
                                Text(
                                  rating.toStringAsFixed(1),
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            '$reviewCount ${S.of(context).reviews}',
                            style: TextStyle(fontSize: 11, color: colors.textSecondary),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _placeholder(AppColors colors) => Container(
        width: 110,
        height: 130,
        decoration: BoxDecoration(
          gradient: colors.primaryGradient,
        ),
        child: const Center(child: Icon(Icons.spa_outlined, size: 36, color: Colors.white24)),
      );
}
