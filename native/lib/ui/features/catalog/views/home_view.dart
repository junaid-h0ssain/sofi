import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../di.dart';
import '../../../../core/widgets/status_views.dart';
import '../../../app_shell.dart';
import '../../../core/product_card.dart';
import '../../auth/view_models/auth_controller.dart';
import '../view_models/catalog_providers.dart';
import 'product_detail_view.dart';

void _goToShop(BuildContext context, WidgetRef ref) {
  ref.read(shellTabProvider.notifier).select(1);
}

void _openProduct(BuildContext context, String slug) {
  Navigator.of(context)
      .push(MaterialPageRoute(builder: (_) => ProductDetailView(slug: slug)));
}

class HomeView extends ConsumerWidget {
  const HomeView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final featured = ref.watch(featuredProvider);
    final auth = ref.watch(authControllerProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('SoFi')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 1100),
          child: ListView(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      auth.authenticated
                          ? 'Hi ${auth.user?.name.split(' ').first}, welcome back'
                          : 'Electronics, delivered',
                      style: theme.textTheme.headlineMedium
                          ?.copyWith(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Laptops, phones and gadgets from the brands you trust.',
                      style: theme.textTheme.bodyLarge
                          ?.copyWith(color: theme.colorScheme.outline),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    FilledButton.icon(
                      icon: const Icon(Icons.storefront_outlined),
                      label: const Text('Shop all products'),
                      onPressed: () => _goToShop(context, ref),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Text('Featured',
                    style: theme.textTheme.titleLarge
                        ?.copyWith(fontWeight: FontWeight.w700)),
              ),
              featured.when(
                loading: () => const Center(
                    child: Padding(
                        padding: EdgeInsets.all(48),
                        child: CircularProgressIndicator())),
                error: (error, _) => Padding(
                  padding: const EdgeInsets.all(24),
                  child: ErrorRetryView(
                      message: error.toString(),
                      onRetry: () =>
                          ref.invalidate(featuredProvider)),
                ),
                data: (products) {
                  if (products.isEmpty) {
                    return const EmptyView(
                        icon: Icons.star_outline,
                        title: 'No featured products yet');
                  }
                  return GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    gridDelegate:
                        const SliverGridDelegateWithMaxCrossAxisExtent(
                            maxCrossAxisExtent: 260,
                            mainAxisExtent: 300,
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12),
                    itemCount: products.length,
                    itemBuilder: (context, index) => ProductCard(
                      config: ref.watch(configProvider),
                      product: products[index],
                      onTap: () => _openProduct(
                          context, products[index].slug),
                    ),
                  );
                },
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
