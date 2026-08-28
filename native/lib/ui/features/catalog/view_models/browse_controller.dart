import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../../di.dart';
import '../../../../../data/models/catalog.dart';

enum ProductSort { newest, priceAsc, priceDesc, name }

extension ProductSortApi on ProductSort {
  String get apiValue {
    switch (this) {
      case ProductSort.newest:
        return 'newest';
      case ProductSort.priceAsc:
        return 'price-asc';
      case ProductSort.priceDesc:
        return 'price-desc';
      case ProductSort.name:
        return 'name';
    }
  }

  String get label {
    switch (this) {
      case ProductSort.newest:
        return 'Newest';
      case ProductSort.priceAsc:
        return 'Price: low to high';
      case ProductSort.priceDesc:
        return 'Price: high to low';
      case ProductSort.name:
        return 'Name';
    }
  }
}

class BrowseFilter {
  const BrowseFilter({
    this.q = '',
    this.brands = const {},
    this.categories = const {},
    this.sort = ProductSort.newest,
    this.min,
    this.max,
  });

  final String q;
  final Set<String> brands;
  final Set<String> categories;
  final ProductSort sort;
  final num? min;
  final num? max;

  bool get hasActiveFilters =>
      q.isNotEmpty ||
      brands.isNotEmpty ||
      categories.isNotEmpty ||
      sort != ProductSort.newest ||
      min != null ||
      max != null;

  BrowseFilter copyWith({
    String? q,
    Set<String>? brands,
    Set<String>? categories,
    ProductSort? sort,
    Object? min = _sentinel,
    Object? max = _sentinel,
  }) {
    return BrowseFilter(
      q: q ?? this.q,
      brands: brands ?? this.brands,
      categories: categories ?? this.categories,
      sort: sort ?? this.sort,
      min: identical(min, _sentinel) ? this.min : min as num?,
      max: identical(max, _sentinel) ? this.max : max as num?,
    );
  }

  static const _sentinel = Object();
}

class BrowseState {
  const BrowseState({
    this.products = const [],
    this.total = 0,
    this.page = 0,
    this.pages = 0,
    this.loading = false,
    this.loadingMore = false,
    this.error,
  });

  final List<Product> products;
  final int total;
  final int page;
  final int pages;
  final bool loading;

  /// True while the next page is being fetched.
  final bool loadingMore;
  final String? error;

  bool get hasMore => page < pages && !loading && error == null;

  BrowseState copyWith({
    List<Product>? products,
    int? total,
    int? page,
    int? pages,
    bool? loading,
    bool? loadingMore,
    String? error,
    bool clearError = false,
  }) {
    return BrowseState(
      products: products ?? this.products,
      total: total ?? this.total,
      page: page ?? this.page,
      pages: pages ?? this.pages,
      loading: loading ?? this.loading,
      loadingMore: loadingMore ?? this.loadingMore,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class BrowseController extends Notifier<BrowseState> {
  BrowseFilter _filter = const BrowseFilter();

  BrowseFilter get filter => _filter;

  @override
  BrowseState build() {
    scheduleMicrotask(_reload);
    return const BrowseState(loading: true);
  }

  void applyFilter(BrowseFilter next) {
    if (next.q != _filter.q ||
        next.sort != _filter.sort ||
        !setEquals(next.brands, _filter.brands) ||
        !setEquals(next.categories, _filter.categories) ||
        next.min != _filter.min ||
        next.max != _filter.max) {
      _filter = next;
      _reload();
    }
  }

  Future<void> retry() => _reload();

  Future<void> loadMore() async {
    if (!state.hasMore || state.loadingMore) return;
    state = state.copyWith(loadingMore: true, clearError: true);
    try {
      final paged = await ref.read(catalogRepositoryProvider).list(
            q: _filter.q,
            brands: _filter.brands.toList(),
            categories: _filter.categories.toList(),
            sort: _filter.sort.apiValue,
            min: _filter.min,
            max: _filter.max,
            page: state.page + 1,
          );
      state = state.copyWith(
        products: [...state.products, ...paged.items],
        total: paged.total,
        page: paged.page,
        pages: paged.pages,
        loadingMore: false,
      );
    } catch (e) {
      state = state.copyWith(loadingMore: false, error: e.toString());
    }
  }

  Future<void> _reload() async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      final paged = await ref.read(catalogRepositoryProvider).list(
            q: _filter.q,
            brands: _filter.brands.toList(),
            categories: _filter.categories.toList(),
            sort: _filter.sort.apiValue,
            min: _filter.min,
            max: _filter.max,
          );
      state = BrowseState(
        products: paged.items,
        total: paged.total,
        page: paged.page,
        pages: paged.pages,
      );
    } catch (e) {
      state = state.copyWith(loading: false, error: e.toString());
    }
  }
}

final browseControllerProvider =
    NotifierProvider<BrowseController, BrowseState>(BrowseController.new);
