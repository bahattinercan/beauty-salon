import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';

class GalleryStrip extends StatelessWidget {
  final List<String> images;

  const GalleryStrip({super.key, required this.images});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);

    return SizedBox(
      height: 90,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: images.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          return ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: Image.network(
              images[index],
              width: 90,
              height: 90,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => Container(
                width: 90,
                height: 90,
                color: colors.secondary,
                child: Icon(Icons.image, color: colors.textSecondary),
              ),
            ),
          );
        },
      ),
    );
  }
}
