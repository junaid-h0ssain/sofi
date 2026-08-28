import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/money.dart';
import '../../../../core/widgets/product_image.dart';
import '../../../../core/widgets/status_views.dart';
import '../../../../di.dart';
import '../../../app_shell.dart';
import '../../orders/view_models/order_providers.dart';

class OrderConfirmationView extends ConsumerWidget {
  const OrderConfirmationView({super.key, required this.orderId});

  final String orderId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(orderDetailProvider(orderId));

    return Scaffold(
      appBar: AppBar(title: const Text('Order confirmed')),
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
              Column(children: [
                CircleAvatar(
                  radius: 32,
                  backgroundColor:
                      Theme.of(context).colorScheme.primaryContainer,
                  child: Icon(Icons.check_rounded,
                      size: 36,
                      color: Theme.of(context)
                          .colorScheme
                          .onPrimaryContainer),
                ),
                const SizedBox(height: 12),
                Text('Thank you!',
                    style: Theme.of(context).textTheme.headlineSmall),
                Text('Order #${order.id.substring(0, 8)}',
                    style: Theme.of(context).textTheme.bodyMedium
                        ?.copyWith(
                            color: Theme.of(context)
                                .colorScheme
                                .outline)),
              ]),
              const SizedBox(height: 24),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(crossAxisAlignment:
                      CrossAxisAlignment.stretch, children: [
                    for (final item in order.items)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        child: Row(children: [
                          ProductImage(
                            config: ref.watch(configProvider),
                            categorySlug: 'laptop',
                            imageUrl: item.imageUrl,
                            size: 44,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(item.productName,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis),
                          ),
                          Text('${item.quantity} × '
                              '${formatCents(item.unitPriceCents)}'),
                        ]),
                      ),
                    const Divider(height: 24),
                    _row(context, 'Subtotal',
                        formatCents(order.subtotalCents)),
                    _row(context, 'Shipping',
                        formatCents(order.shippingCents)),
                    const Divider(height: 16),
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
              const SizedBox(height: 20),
              FilledButton(
                onPressed: () {
                  ref.read(shellTabProvider.notifier).select(3);
                  Navigator.of(context)
                      .popUntil((route) => route.isFirst);
                },
                child: const Text('View my orders'),
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
