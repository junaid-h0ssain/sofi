import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../../di.dart';
import '../../../../../data/models/cart.dart';

class CartState {
  const CartState({
    this.items = const [],
    this.loading = false,
    this.mutating = false,
    this.error,
  });

  final List<CartItem> items;
  final bool loading;
  final bool mutating;
  final String? error;

  int get itemCount =>
      items.fold(0, (sum, item) => sum + item.quantity);

  int get subtotalCents => items.fold(
      0, (sum, item) => sum + item.product.priceCents * item.quantity);

  CartState copyWith({
    List<CartItem>? items,
    bool? loading,
    bool? mutating,
    String? error,
    bool clearError = false,
  }) {
    return CartState(
      items: items ?? this.items,
      loading: loading ?? this.loading,
      mutating: mutating ?? this.mutating,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class CartController extends Notifier<CartState> {
  @override
  CartState build() {
    ref.keepAlive();
    return const CartState();
  }

  Future<void> load() async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      final items = await ref.read(cartRepositoryProvider).items();
      state = CartState(items: items);
    } catch (e) {
      state =
          state.copyWith(loading: false, error: e.toString());
    }
  }

  Future<bool> add(String productId, {int quantity = 1}) async {
    state = state.copyWith(mutating: true, clearError: true);
    try {
      await ref.read(cartRepositoryProvider).add(productId, quantity);
      await _refresh();
      return true;
    } catch (e) {
      state = state.copyWith(mutating: false, error: e.toString());
      return false;
    }
  }

  Future<void> setQuantity(String itemId, int quantity) async {
    if (quantity < 1 || quantity > 99) return;
    state = state.copyWith(mutating: true, clearError: true);
    try {
      await ref
          .read(cartRepositoryProvider)
          .setQuantity(itemId, quantity);
      await _refresh();
    } catch (e) {
      state = state.copyWith(mutating: false, error: e.toString());
    }
  }

  Future<void> remove(String itemId) async {
    state = state.copyWith(mutating: true, clearError: true);
    try {
      await ref.read(cartRepositoryProvider).remove(itemId);
      await _refresh();
    } catch (e) {
      state = state.copyWith(mutating: false, error: e.toString());
    }
  }

  Future<void> clear() async {
    state = state.copyWith(mutating: true, clearError: true);
    try {
      await ref.read(cartRepositoryProvider).clear();
      state = const CartState();
    } catch (e) {
      state = state.copyWith(mutating: false, error: e.toString());
    }
  }

  void reset() {
    state = const CartState();
  }

  Future<void> _refresh() async {
    try {
      final items = await ref.read(cartRepositoryProvider).items();
      state = CartState(items: items);
    } catch (e) {
      state = state.copyWith(mutating: false, error: e.toString());
    }
  }
}

final cartControllerProvider =
    NotifierProvider<CartController, CartState>(CartController.new);

final cartCountProvider = Provider<int>(
    (ref) => ref.watch(cartControllerProvider).itemCount);
