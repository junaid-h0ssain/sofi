import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'features/auth/view_models/auth_controller.dart';
import 'features/cart/view_models/cart_controller.dart';
import 'features/catalog/views/browse_view.dart';
import 'features/catalog/views/home_view.dart';
import 'features/cart/views/cart_view.dart';
import 'features/orders/view_models/order_providers.dart';
import 'features/orders/views/orders_view.dart';
import 'features/auth/views/account_view.dart';

class ShellTabController extends Notifier<int> {
  @override
  int build() => 0;

  void select(int index) => state = index;
}

final shellTabProvider =
    NotifierProvider<ShellTabController, int>(ShellTabController.new);

class _TabSpec {
  const _TabSpec(this.label, this.icon, this.selectedIcon);

  final String label;
  final IconData icon;
  final IconData selectedIcon;
}

const _tabs = [
  _TabSpec('Home', Icons.home_outlined, Icons.home),
  _TabSpec('Shop', Icons.storefront_outlined, Icons.storefront),
  _TabSpec('Cart', Icons.shopping_cart_outlined, Icons.shopping_cart),
  _TabSpec('Orders', Icons.receipt_long_outlined, Icons.receipt_long),
  _TabSpec('Account', Icons.person_outline, Icons.person),
];

class AppShell extends ConsumerStatefulWidget {
  const AppShell({super.key});

  @override
  ConsumerState<AppShell> createState() => _AppShellState();
}

class _AppShellState extends ConsumerState<AppShell> {
  @override
  Widget build(BuildContext context) {
    ref.listen(authControllerProvider, (previous, next) {
      final wasAuthed = previous?.authenticated ?? false;
      if (!wasAuthed && next.authenticated) {
        ref.read(cartControllerProvider.notifier).load();
      }
      if (wasAuthed && !next.authenticated) {
        ref.read(cartControllerProvider.notifier).reset();
        ref.invalidate(ordersProvider);
        ref.invalidate(orderDetailProvider);
      }
    });

    final tab = ref.watch(shellTabProvider);
    final cartCount = ref.watch(cartCountProvider);

    final views = [
      const HomeView(),
      const BrowseView(),
      const CartView(),
      const OrdersView(),
      const AccountView(),
    ];

    return Scaffold(
      body: LayoutBuilder(
        builder: (context, constraints) {
          final wide = constraints.maxWidth >= 600;

          if (wide) {
            return Row(
              children: [
                NavigationRail(
                  selectedIndex: tab,
                  onDestinationSelected: (index) => ref
                      .read(shellTabProvider.notifier)
                      .select(index),
                  extended: constraints.maxWidth >= 1000,
                  minExtendedWidth: 220,
                  labelType: constraints.maxWidth >= 1000
                      ? NavigationRailLabelType.none
                      : NavigationRailLabelType.all,
                  leading: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    child:
                        _BrandMark(extended: constraints.maxWidth >= 1000),
                  ),
                  destinations: [
                    for (var i = 0; i < _tabs.length; i++)
                      NavigationRailDestination(
                        icon: i == 2
                            ? Badge.count(
                                count: cartCount,
                                isLabelVisible: cartCount > 0,
                                child: Icon(_tabs[i].icon))
                            : Icon(_tabs[i].icon),
                        selectedIcon: i == 2
                            ? Badge.count(
                                count: cartCount,
                                isLabelVisible: cartCount > 0,
                                child: Icon(_tabs[i].selectedIcon))
                            : Icon(_tabs[i].selectedIcon),
                        label: Text(_tabs[i].label),
                      ),
                  ],
                ),
                VerticalDivider(width: 1),
                Expanded(child: IndexedStack(index: tab, children: views)),
              ],
            );
          }

          return Column(
            children: [
              Expanded(child: IndexedStack(index: tab, children: views)),
              NavigationBar(
                selectedIndex: tab,
                onDestinationSelected: (index) =>
                    ref.read(shellTabProvider.notifier).select(index),
                destinations: [
                  for (var i = 0; i < _tabs.length; i++)
                    NavigationDestination(
                      icon: i == 2
                          ? Badge.count(
                              count: cartCount,
                              isLabelVisible: cartCount > 0,
                              child: Icon(_tabs[i].icon))
                          : Icon(_tabs[i].icon),
                      selectedIcon: i == 2
                          ? Badge.count(
                              count: cartCount,
                              isLabelVisible: cartCount > 0,
                              child: Icon(_tabs[i].selectedIcon))
                          : Icon(_tabs[i].selectedIcon),
                      label: _tabs[i].label,
                    ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }
}

class _BrandMark extends StatelessWidget {
  const _BrandMark({required this.extended});

  final bool extended;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.shopping_bag_outlined,
            color: theme.colorScheme.primary),
        if (extended) ...[
          const SizedBox(width: 8),
          Text('SoFi',
              style: theme.textTheme.titleLarge
                  ?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(width: 12),
        ],
      ],
    );
  }
}
