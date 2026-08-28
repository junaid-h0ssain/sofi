import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/money.dart';
import '../../../../core/widgets/product_image.dart';
import '../../../../core/widgets/status_views.dart';
import '../../../../data/models/catalog.dart';
import '../../../../di.dart';
import '../../../app_shell.dart';
import '../../../core/product_card.dart';
import '../../auth/view_models/auth_controller.dart';
import '../../cart/view_models/cart_controller.dart';
import '../view_models/catalog_providers.dart';

class ProductDetailView extends ConsumerStatefulWidget {
  const ProductDetailView({super.key, required this.slug});

  final String slug;

  @override
  ConsumerState<ProductDetailView> createState() =>
      _ProductDetailViewState();
}

class _ProductDetailViewState extends ConsumerState<ProductDetailView> {
  int _quantity = 1;

  @override
  Widget build(BuildContext context) {
    final detail = ref.watch(productDetailProvider(widget.slug));

    return Scaffold(
      appBar: AppBar(title: const Text('Product')),
      body: detail.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => ErrorRetryView(
          message: error.toString(),
          onRetry: () =>
              ref.invalidate(productDetailProvider(widget.slug)),
        ),
        data: (product) {
          final wide = MediaQuery.sizeOf(context).width >= 800;
          final content = wide
              ? Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(flex: 2, child: _image(context, product)),
                    Expanded(flex: 3, child: _info(context, product)),
                  ],
                )
              : Column(children: [
                  _image(context, product),
                  Expanded(child: _info(context, product)),
                ]);

          return Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1100),
              child: content,
            ),
          );
        },
      ),
    );
  }

  Widget _image(BuildContext context, Product product) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Hero(
        tag: 'product-${product.id}',
        child: ProductImage(
          config: ref.watch(configProvider),
          categorySlug: product.category.slug,
          imageUrl: product.imageUrl,
          size: 320,
        ),
      ),
    );
  }

  Widget _info(BuildContext context, Product product) {
    final theme = Theme.of(context);
    final cart = ref.watch(cartControllerProvider);
    final auth = ref.watch(authControllerProvider);

    return ListView(
      padding: const EdgeInsets.all(20),
      shrinkWrap: true,
      children: [
        Text(
          '${product.brand.name} · ${product.category.name}',
          style: theme.textTheme.labelLarge?.copyWith(
              color: theme.colorScheme.primary, letterSpacing: 0.5),
        ),
        const SizedBox(height: 6),
        Text(product.name,
            style: theme.textTheme.headlineSmall
                ?.copyWith(fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        Row(children: [
          Text(formatCents(product.priceCents),
              style: theme.textTheme.headlineSmall
                  ?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(width: 12),
          _StockChip(stock: product.stock),
        ]),
        const SizedBox(height: 16),
        Text(product.description, style: theme.textTheme.bodyMedium),
        if (product.specs.isNotEmpty) ...[
          const SizedBox(height: 24),
          Text('Specifications', style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Column(children: [
                for (final entry in product.specs.entries)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SizedBox(
                          width: 140,
                          child: Text(entry.key,
                              style: theme.textTheme.bodySmall?.copyWith(
                                  color: theme.colorScheme.outline)),
                        ),
                        Expanded(
                            child: Text(entry.value,
                                style: theme.textTheme.bodyMedium)),
                      ],
                    ),
                  ),
              ]),
            ),
          ),
        ],
        const SizedBox(height: 24),
        Row(children: [
          if (product.inStock) ...[
            DropdownButton<int>(
              value: _quantity.clamp(1, product.stock > 10 ? 10 : product.stock),
              items: [
                for (var i = 1;
                    i <= (product.stock > 10 ? 10 : product.stock);
                    i++)
                  DropdownMenuItem(value: i, child: Text('$i')),
              ],
              onChanged: (value) =>
                  setState(() => _quantity = value ?? 1),
            ),
            const SizedBox(width: 12),
          ],
          Expanded(
            child: FilledButton.icon(
              icon: const Icon(Icons.add_shopping_cart),
              label: const Text('Add to cart'),
              onPressed: !product.inStock || cart.mutating
                  ? null
                  : () => _addToCart(product),
            ),
          ),
        ]),
        if (!auth.authenticated) ...[
          const SizedBox(height: 8),
          Text('You need an account to place orders.',
              style: theme.textTheme.bodySmall
                  ?.copyWith(color: theme.colorScheme.outline)),
        ],
        const SizedBox(height: 32),
        _related(context, product.slug),
      ],
    );
  }

  Widget _related(BuildContext context, String slug) {
    final theme = Theme.of(context);
    final related = ref.watch(relatedProductsProvider(slug));

    return related.maybeWhen(
      data: (products) => products.isEmpty
          ? const SizedBox.shrink()
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('More in this category',
                    style: theme.textTheme.titleMedium),
                const SizedBox(height: 8),
                SizedBox(
                  height: 280,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: products.length,
                    separatorBuilder: (_, _) => const SizedBox(width: 12),
                    itemBuilder: (context, index) => SizedBox(
                      width: 200,
                      child: ProductCard(
                        config: ref.watch(configProvider),
                        product: products[index],
                        imageHeight: 110,
                        onTap: () => Navigator.of(context)
                            .push(MaterialPageRoute(
                                builder: (_) => ProductDetailView(
                                    slug: products[index].slug))),
                      ),
                    ),
                  ),
                ),
              ],
            ),
      orElse: () => const SizedBox.shrink(),
    );
  }

  Future<void> _addToCart(Product product) async {
    final auth = ref.read(authControllerProvider);
    if (!auth.authenticated) {
      ref.read(shellTabProvider.notifier).select(4);
      Navigator.of(context).popUntil((route) => route.isFirst);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Sign in to start a cart')));
      return;
    }

    final ok = await ref
        .read(cartControllerProvider.notifier)
        .add(product.id, quantity: _quantity);

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(ok
          ? 'Added $_quantity × ${product.name}'
          : 'Could not add to cart'),
    ));
  }
}

class _StockChip extends StatelessWidget {
  const _StockChip({required this.stock});

  final int stock;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final label = stock > 0 ? '$stock in stock' : 'Out of stock';
    return Chip(
      visualDensity: VisualDensity.compact,
      backgroundColor: stock > 0
          ? theme.colorScheme.secondaryContainer
          : theme.colorScheme.errorContainer,
      labelStyle: TextStyle(
        fontSize: 12,
        color: stock > 0
            ? theme.colorScheme.onSecondaryContainer
            : theme.colorScheme.onErrorContainer,
      ),
      label: Text(label),
    );
  }
}
