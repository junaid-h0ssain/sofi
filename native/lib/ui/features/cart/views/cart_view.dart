import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/money.dart';
import '../../../../core/widgets/status_views.dart';
import '../../../../data/models/cart.dart';
import '../../../app_shell.dart';
import '../../auth/view_models/auth_controller.dart';
import '../view_models/cart_controller.dart';
import 'checkout_view.dart';

class CartView extends ConsumerWidget {
  const CartView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);
    final cart = ref.watch(cartControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Cart'),
        actions: [
          if (cart.items.isNotEmpty)
            TextButton(
              onPressed:
                  cart.mutating ? null : () => _confirmClear(context, ref),
              child: const Text('Clear'),
            ),
          const SizedBox(width: 8),
        ],
      ),
      body: !auth.authenticated
          ? EmptyView(
              icon: Icons.lock_outline,
              title: 'Sign in to see your cart',
              subtitle: 'Your cart is saved to your account.',
              action: FilledButton(
                onPressed: () =>
                    ref.read(shellTabProvider.notifier).select(4),
                child: const Text('Sign in'),
              ),
            )
          : cart.loading && cart.items.isEmpty
              ? const Center(child: CircularProgressIndicator())
              : cart.error != null && cart.items.isEmpty
                  ? ErrorRetryView(
                      message: cart.error!,
                      onRetry: () => ref
                          .read(cartControllerProvider.notifier)
                          .load())
                  : cart.items.isEmpty
                      ? const EmptyView(
                          icon: Icons.shopping_cart_outlined,
                          title: 'Your cart is empty',
                          subtitle:
                              'Browse the catalog to find something you like.',
                        )
                      : Center(
                          child: ConstrainedBox(
                            constraints:
                                const BoxConstraints(maxWidth: 800),
                            child: Column(children: [
                              Expanded(child: _list(context, ref, cart)),
                              _summary(context, ref, cart),
                            ]),
                          ),
                        ),
    );
  }

  Widget _list(BuildContext context, WidgetRef ref, CartState cart) {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: cart.items.length,
      separatorBuilder: (_, _) => const Divider(height: 1),
      itemBuilder: (context, index) =>
          _CartTile(item: cart.items[index], disabled: cart.mutating),
    );
  }

  Widget _summary(BuildContext context, WidgetRef ref, CartState cart) {
    final theme = Theme.of(context);
    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(children: [
              Text('Subtotal', style: theme.textTheme.bodyMedium),
              const Spacer(),
              Text(formatCents(cart.subtotalCents),
                  style: theme.textTheme.titleLarge
                      ?.copyWith(fontWeight: FontWeight.w700)),
            ]),
            const SizedBox(height: 4),
            Text('Shipping calculated at checkout.',
                style: theme.textTheme.bodySmall
                    ?.copyWith(color: theme.colorScheme.outline)),
            const SizedBox(height: 12),
            FilledButton.icon(
              icon: const Icon(Icons.arrow_forward),
              label: const Text('Checkout'),
              onPressed: cart.mutating
                  ? null
                  : () => Navigator.of(context).push(MaterialPageRoute(
                      builder: (_) => const CheckoutView())),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmClear(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Clear cart?'),
        content:
            const Text('This removes every item from your cart.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(dialogContext, false),
              child: const Text('Cancel')),
          FilledButton(
              onPressed: () => Navigator.pop(dialogContext, true),
              child: const Text('Clear')),
        ],
      ),
    );
    if (confirmed == true) {
      await ref.read(cartControllerProvider.notifier).clear();
    }
  }
}

class _CartTile extends ConsumerStatefulWidget {
  const _CartTile({required this.item, required this.disabled});

  final CartItem item;
  final bool disabled;

  @override
  ConsumerState<_CartTile> createState() => _CartTileState();
}

class _CartTileState extends ConsumerState<_CartTile> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final item = widget.item;

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(vertical: 8),
      title: Text(item.product.name,
          maxLines: 2, overflow: TextOverflow.ellipsis),
      subtitle: Text(formatCents(item.product.priceCents)),
      trailing: Row(mainAxisSize: MainAxisSize.min, children: [
        IconButton(
          icon: const Icon(Icons.remove_circle_outline),
          onPressed: widget.disabled
              ? null
              : () async {
                  if (item.quantity <= 1) {
                    await ref
                        .read(cartControllerProvider.notifier)
                        .remove(item.id);
                  } else {
                    await ref
                        .read(cartControllerProvider.notifier)
                        .setQuantity(item.id, item.quantity - 1);
                  }
                },
        ),
        Text('${item.quantity}', style: theme.textTheme.titleMedium),
        IconButton(
          icon: const Icon(Icons.add_circle_outline),
          onPressed: widget.disabled || item.quantity >= 99
              ? null
              : () => ref
                  .read(cartControllerProvider.notifier)
                  .setQuantity(item.id, item.quantity + 1),
        ),
        const SizedBox(width: 4),
        Text(formatCents(item.product.priceCents * item.quantity),
            style: theme.textTheme.titleSmall),
        IconButton(
          icon:
              Icon(Icons.delete_outline, color: theme.colorScheme.error),
          onPressed: widget.disabled
              ? null
              : () =>
                  ref.read(cartControllerProvider.notifier).remove(item.id),
        ),
      ]),
    );
  }
}
