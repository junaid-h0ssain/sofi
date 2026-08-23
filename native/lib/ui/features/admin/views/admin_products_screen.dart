import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/api_error.dart';
import '../../../../core/money.dart';
import '../../../../core/widgets/status_views.dart';
import '../../../../di.dart';
import '../view_models/admin_providers.dart';
import 'admin_product_edit_view.dart';

class AdminProductsScreen extends ConsumerWidget {
  const AdminProductsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final products = ref.watch(adminProductsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Products')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _openEditor(context),
        child: const Icon(Icons.add),
      ),
      body: products.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => ErrorRetryView(
            message: error.toString(),
            onRetry: () => ref.invalidate(adminProductsProvider)),
        data: (list) => Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 900),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              separatorBuilder: (_, _) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final product = list[index];
                return ListTile(
                  leading: Icon(
                    product.featured
                        ? Icons.star_rounded
                        : Icons.star_outline,
                    color: product.featured
                        ? Theme.of(context).colorScheme.primary
                        : Theme.of(context).colorScheme.outline,
                  ),
                  title: Text(product.name,
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                  subtitle:
                      Text('${product.brandName} · ${product.categoryName}'),
                  trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(formatCents(product.priceCents)),
                        Text('${product.stock} in stock',
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(
                                    color: Theme.of(context)
                                        .colorScheme
                                        .outline)),
                      ],
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: const Icon(Icons.edit_outlined),
                      tooltip: 'Edit',
                      onPressed: () =>
                          _openEditor(context, id: product.id),
                    ),
                    IconButton(
                      icon: Icon(Icons.delete_outline,
                          color: Theme.of(context).colorScheme.error),
                      tooltip: 'Delete',
                      onPressed: () =>
                          _confirmDelete(context, ref, product),
                    ),
                  ]),
                );
              },
            ),
          ),
        ),
      ),
    );
  }

  void _openEditor(BuildContext context, {String? id}) {
    Navigator.of(context).push(MaterialPageRoute(
        builder: (_) => AdminProductEditView(productId: id)));
  }

  Future<void> _confirmDelete(
      BuildContext context, WidgetRef ref, dynamic product) async {
    final messenger = ScaffoldMessenger.of(context);

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Delete product?'),
        content: Text('"${product.name}" will be removed permanently.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(dialogContext, false),
              child: const Text('Cancel')),
          FilledButton(
              style: FilledButton.styleFrom(
                  backgroundColor:
                      Theme.of(dialogContext).colorScheme.error),
              onPressed: () => Navigator.pop(dialogContext, true),
              child: const Text('Delete')),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await ref
          .read(adminRepositoryProvider)
          .deleteProduct(product.id);
      ref.invalidate(adminProductsProvider);
      ref.invalidate(adminStatsProvider);
    } on ApiError catch (e) {
      messenger.showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      messenger.showSnackBar(const SnackBar(
          content: Text('Could not delete the product')));
    }
  }
}
