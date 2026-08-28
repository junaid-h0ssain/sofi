import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/widgets/status_views.dart';
import '../../admin/views/admin_dashboard_view.dart';
import '../../admin/views/admin_products_screen.dart';
import '../../admin/views/admin_taxonomy_screen.dart';
import '../view_models/auth_controller.dart';
import 'auth_form.dart';

class AccountView extends ConsumerWidget {
  const AccountView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);

    switch (auth.status) {
      case AuthStatus.loading:
        return const Center(child: CircularProgressIndicator());
      case AuthStatus.unauthenticated:
        return const AuthForm();
      case AuthStatus.authenticated:
        return _signedIn(context, ref, auth);
    }
  }

  Widget _signedIn(BuildContext context, WidgetRef ref, AuthState auth) {
    final user = auth.user!;
    final theme = Theme.of(context);

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 560),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 28,
                      backgroundColor:
                          theme.colorScheme.primaryContainer,
                      child: Text(
                        user.name.isNotEmpty
                            ? user.name[0].toUpperCase()
                            : '?',
                        style: theme.textTheme.titleLarge?.copyWith(
                            color: theme.colorScheme.onPrimaryContainer),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(user.name,
                              style: theme.textTheme.titleMedium),
                          Text(user.email,
                              style: theme.textTheme.bodyMedium?.copyWith(
                                  color: theme.colorScheme.outline)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            if (auth.isAdmin) ...[
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.only(left: 4),
                child: Text('Admin panel', style: theme.textTheme.titleSmall),
              ),
              const SizedBox(height: 8),
              Card(
                clipBehavior: Clip.antiAlias,
                child: Column(children: [
                  ListTile(
                    leading: const Icon(Icons.dashboard_outlined),
                    title: const Text('Dashboard'),
                    onTap: () => _push(context,
                        const AdminDashboardView()),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.inventory_2_outlined),
                    title: const Text('Products'),
                    onTap: () => _push(context,
                        const AdminProductsScreen()),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.category_outlined),
                    title: const Text('Brands & categories'),
                    onTap: () => _push(context,
                        const AdminTaxonomyScreen()),
                  ),
                ]),
              ),
            ] else ...[
              const SizedBox(height: 8),
              EmptyView(
                icon: Icons.lock_outline,
                title: 'Shopper account',
                subtitle:
                    'You can browse the catalog, manage your cart and place orders.',
              ),
            ],
            const SizedBox(height: 16),
            OutlinedButton.icon(
              icon: const Icon(Icons.logout),
              label: const Text('Sign out'),
              onPressed: () =>
                  ref.read(authControllerProvider.notifier).signOut(),
            ),
          ],
        ),
      ),
    );
  }

  void _push(BuildContext context, Widget view) {
    Navigator.of(context)
        .push(MaterialPageRoute(builder: (_) => view));
  }
}
