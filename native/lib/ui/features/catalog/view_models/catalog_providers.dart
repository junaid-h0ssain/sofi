import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../../di.dart';
import '../../../../../data/models/admin.dart';
import '../../../../../data/models/catalog.dart';

final featuredProvider =
    FutureProvider.autoDispose<List<Product>>((ref) async {
  ref.keepAlive();
  return ref.watch(catalogRepositoryProvider).featured();
});

final productDetailProvider =
    FutureProvider.autoDispose.family<Product, String>((ref, slug) {
  return ref.watch(catalogRepositoryProvider).bySlug(slug);
});

final relatedProductsProvider =
    FutureProvider.autoDispose.family<List<Product>, String>((ref, slug) {
  return ref.watch(catalogRepositoryProvider).related(slug);
});

final filterBrandsProvider =
    FutureProvider.autoDispose<List<Brand>>((ref) {
  return ref.watch(catalogRepositoryProvider).brands();
});

final filterCategoriesProvider =
    FutureProvider.autoDispose<List<TaxonomyWithCount>>((ref) {
  return ref.watch(catalogRepositoryProvider).categories();
});
