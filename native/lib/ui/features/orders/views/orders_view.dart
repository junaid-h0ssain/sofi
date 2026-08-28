import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/money.dart';
import '../../../../core/widgets/status_views.dart';
import '../../../app_shell.dart';
import '../../auth/view_models/auth_controller.dart';
import '../view_models/order_providers.dart';
import 'order_detail_view.dart';

class OrdersView extends ConsumerWidget {
  const OrdersView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);
    final orders = ref.watch(ordersProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Orders')),
      body: !auth.authenticated
          ? EmptyView(
              icon: Icons.lock_outline,
              title: 'Sign in to see your orders',
              subtitle: 'Your purchase history lives on your account.',
              action: FilledButton(
                onPressed: () => ref
                    .read(shellTabProvider.notifier)
                    .select(4),
                child: const Text('Sign in'),
              ),
            )
          : orders.when(
              loading: () =>
                  const Center(child: CircularProgressIndicator()),
              error: (error, _) => ErrorRetryView(
                  message: error.toString(),
                  onRetry: () => ref.invalidate(ordersProvider)),
              data: (list) {
                if (list.isEmpty) {
                  return EmptyView(
                    icon: Icons.receipt_long_outlined,
                    title: 'No orders yet',
                    subtitle:
                        'When you place an order it shows up here.',
                    action: FilledButton(
                      onPressed: () => ref
                          .read(shellTabProvider.notifier)
                          .select(1),
                      child: const Text('Start shopping'),
                    ),
                  );
                }
                return Center(
                  child: ConstrainedBox(
                    constraints:
                        const BoxConstraints(maxWidth: 800),
                    child: ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: list.length,
                      separatorBuilder: (_, _) =>
                          const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final order = list[index];
                        return Card(
                          child: ListTile(
                            onTap: () =>
                                Navigator.of(context).push(
                              MaterialPageRoute(
                                  builder: (_) => OrderDetailView(
                                      orderId: order.id)),
                            ),
                            title: Text(formatCents(order.totalCents),
                                style: Theme.of(context)
                                    .textTheme
                                    .titleMedium),
                            subtitle: Text(
                                '#${order.id.substring(0, 8)} · ${order.createdAt.toLocal()} · ${order.city}, ${order.country}'),
                            trailing: Chip(
                              visualDensity: VisualDensity.compact,
                              label: Text(order.status),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                );
              },
            ),
    );
  }
}
