import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/money.dart';
import '../../../../core/widgets/product_image.dart';
import '../../../../core/widgets/status_views.dart';
import '../../../../di.dart';
import '../view_models/order_providers.dart';

class OrderDetailView extends ConsumerWidget {
  const OrderDetailView({super.key, required this.orderId});

  final String orderId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(orderDetailProvider(orderId));

    return Scaffold(
      appBar: AppBar(title: const Text('Order')),
      body: detail.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => ErrorRetryView(
            message: error.toString(),
            onRetry: () =>
                ref.invalidate(orderDetailProvider(orderId))),
        data: (order) => Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 720),
            child: ListView(padding: const EdgeInsets.all(20), children: [
              Row(children: [
                Text('Order #${order.id.substring(0, 8)}',
                    style: Theme.of(context).textTheme.titleLarge),
                const Spacer(),
                Chip(label: Text(order.status)),
              ]),
              const SizedBox(height: 4),
              Text('Placed ${order.createdAt.toLocal()}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.outline)),
              const SizedBox(height: 16),
              Card(
                child: Column(children: [
                  for (final item in order.items)
                    ListTile(
                      leading: ProductImage(
                        config: ref.watch(configProvider),
                        categorySlug: 'laptop',
                        imageUrl: item.imageUrl,
                        size: 48,
                      ),
                      title: Text(item.productName,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis),
                      subtitle: Text(
                          '${item.quantity} × ${formatCents(item.unitPriceCents)}'),
                      trailing: Text(formatCents(
                          item.quantity * item.unitPriceCents)),
                    ),
                ]),
              ),
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(crossAxisAlignment:
                      CrossAxisAlignment.stretch, children: [
                    _row(context, 'Subtotal',
                        formatCents(order.subtotalCents)),
                    _row(context, 'Shipping',
                        formatCents(order.shippingCents)),
                    const Divider(height: 20),
                    _row(context, 'Total', formatCents(order.totalCents),
                        bold: true),
                  ]),
                ),
              ),
              const SizedBox(height: 12),
              Card(
                child: ListTile(
                  leading: const Icon(Icons.local_shipping_outlined),
                  title: Text(order.fullName),
                  subtitle: Text(
                      '${order.street}, ${order.city} ${order.postalCode}, ${order.country}'),
                ),
              ),
            ]),
          ),
        ),
      ),
    );
  }

  Widget _row(BuildContext context, String label, String value,
      {bool bold = false}) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(children: [
        Text(label, style: theme.textTheme.bodyMedium),
        const Spacer(),
        Text(value,
            style: theme.textTheme.titleMedium?.copyWith(
                fontWeight:
                    bold ? FontWeight.w700 : FontWeight.w500)),
      ]),
    );
  }
}
