import 'package:flutter/material.dart';

import '../../core/config.dart';
import '../../core/money.dart';
import '../../core/widgets/product_image.dart';
import '../../data/models/catalog.dart';

class ProductCard extends StatelessWidget {
  const ProductCard({
    super.key,
    required this.config,
    required this.product,
    required this.onTap,
    this.imageHeight = 140,
  });

  final AppConfig config;
  final Product product;
  final VoidCallback onTap;
  final double imageHeight;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SizedBox(
              height: imageHeight,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Padding(
                    padding: const EdgeInsets.all(8),
                    child: Hero(
                      tag: 'product-${product.id}',
                      child: ProductImage(
                        config: config,
                        categorySlug: product.category.slug,
                        imageUrl: product.imageUrl,
                        size: imageHeight - 16,
                      ),
                    ),
                  ),
                  if (!product.inStock)
                    Positioned(
                      top: 6,
                      right: 6,
                      child: Chip(
                        label: const Text('Sold out'),
                        visualDensity: VisualDensity.compact,
                        backgroundColor: theme.colorScheme.errorContainer,
                        labelStyle: TextStyle(
                          fontSize: 11,
                          color: theme.colorScheme.onErrorContainer,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product.brand.name.toUpperCase(),
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: theme.colorScheme.outline,
                        letterSpacing: 0.5,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      product.name,
                      style: theme.textTheme.titleSmall,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const Spacer(),
                    const SizedBox(height: 8),
                    Text(
                      formatCents(product.priceCents),
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
