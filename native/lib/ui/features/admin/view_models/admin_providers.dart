import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../../di.dart';
import '../../../../../data/models/admin.dart';

final adminStatsProvider =
    FutureProvider.autoDispose<AdminStats>((ref) {
  return ref.watch(adminRepositoryProvider).stats();
});

final adminProductsProvider =
    FutureProvider.autoDispose<List<AdminProductRow>>((ref) {
  return ref.watch(adminRepositoryProvider).products();
});

final adminBrandsProvider =
    FutureProvider.autoDispose<List<TaxonomyWithCount>>((ref) {
  return ref.watch(adminRepositoryProvider).brands();
});

final adminCategoriesProvider =
    FutureProvider.autoDispose<List<TaxonomyWithCount>>((ref) {
  return ref.watch(adminRepositoryProvider).categories();
});
