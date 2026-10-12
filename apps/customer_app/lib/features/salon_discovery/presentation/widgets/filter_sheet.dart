import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../domain/entities/salon_filter.dart';
import 'chip_selector.dart';
import 'star_rating_input.dart';

class FilterSheet extends StatefulWidget {
  final SalonFilter initial;
  final ValueChanged<SalonFilter> onApply;

  const FilterSheet({
    super.key,
    required this.initial,
    required this.onApply,
  });

  @override
  State<FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<FilterSheet> {
  late double _maxDistance = widget.initial.maxDistanceKm;
  late double _minRating = widget.initial.minRating;
  late int _priceRange = widget.initial.priceRange;
  late bool _verifiedOnly = widget.initial.verifiedOnly;

  int get _activeCount =>
      (_maxDistance > 0 ? 1 : 0) +
      (_minRating > 0 ? 1 : 0) +
      (_priceRange > 0 ? 1 : 0) +
      (_verifiedOnly ? 1 : 0);

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final s = S.of(context);

    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: colors.textHint,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(s.discoverFilter,
                    style: Theme.of(context)
                        .textTheme
                        .titleLarge
                        ?.copyWith(fontWeight: FontWeight.bold)),
                TextButton(
                  onPressed: () => setState(() {
                    _maxDistance = 0;
                    _minRating = 0;
                    _priceRange = 0;
                    _verifiedOnly = false;
                  }),
                  child: Text(s.discoverReset, style: TextStyle(color: colors.primary)),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(s.discoverMaxDistance,
                          style: Theme.of(context)
                              .textTheme
                              .titleSmall
                              ?.copyWith(fontWeight: FontWeight.w600)),
                      Text(
                        _maxDistance == 0 ? s.discoverAllDistances : '${_maxDistance.round()} km',
                        style: TextStyle(
                            color: colors.primary, fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                    ],
                  ),
                  Slider(
                    value: _maxDistance,
                    min: 0,
                    max: 20,
                    divisions: 20,
                    activeColor: colors.primary,
                    inactiveColor: colors.secondary,
                    onChanged: (v) => setState(() => _maxDistance = v),
                  ),
                  const SizedBox(height: 20),
                  StarRatingInput(value: _minRating, onChanged: (v) => setState(() => _minRating = v)),
                  const SizedBox(height: 20),
                  Text(s.discoverPriceRange,
                      style: Theme.of(context)
                          .textTheme
                          .titleSmall
                          ?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 10),
                  ChipSelector(
                    options: const [
                      ChipOption('0', 'Tümü'),
                      ChipOption('1', '₺'),
                      ChipOption('2', '₺₺'),
                      ChipOption('3', '₺₺₺'),
                    ],
                    selected: {_priceRange.toString()},
                    onToggle: (v) => setState(() => _priceRange = int.parse(v)),
                  ),
                  const SizedBox(height: 20),
                  SwitchListTile(
                    value: _verifiedOnly,
                    onChanged: (v) => setState(() => _verifiedOnly = v),
                    title: Text(s.discoverVerifiedOnly,
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                    contentPadding: EdgeInsets.zero,
                  ),
                  const SizedBox(height: 10),
                ],
              ),
            ),
          ),
          Padding(
            padding: EdgeInsets.fromLTRB(20, 12, 20, MediaQuery.of(context).padding.bottom + 12),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => widget.onApply(
                  SalonFilter(
                    search: widget.initial.search,
                    categoryId: widget.initial.categoryId,
                    sortBy: widget.initial.sortBy,
                    maxDistanceKm: _maxDistance,
                    minRating: _minRating,
                    priceRange: _priceRange,
                    verifiedOnly: _verifiedOnly,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: colors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(
                  '${s.discoverApply} ($_activeCount ${s.discoverFiltersCount})',
                  style: const TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
