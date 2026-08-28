import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/api_error.dart';
import '../../../../core/widgets/status_views.dart';
import '../../../../di.dart';
import '../view_models/admin_providers.dart';

class AdminTaxonomyScreen extends StatelessWidget {
  const AdminTaxonomyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Brands & categories'),
          bottom: const TabBar(tabs: [
            Tab(text: 'Brands'),
            Tab(text: 'Categories'),
          ]),
        ),
        body: const TabBarView(children: [
          _TaxonomyList.brands(),
          _TaxonomyList.categories(),
        ]),
      ),
    );
  }
}

class _TaxonomyList extends ConsumerStatefulWidget {
  const _TaxonomyList.brands() : kind = _Kind.brands;
  const _TaxonomyList.categories() : kind = _Kind.categories;

  final _Kind kind;

  @override
  ConsumerState<_TaxonomyList> createState() => _TaxonomyListState();
}

enum _Kind { brands, categories }

class _TaxonomyListState extends ConsumerState<_TaxonomyList> {
  final _nameController = TextEditingController();
  bool _adding = false;

  bool get _isBrands => widget.kind == _Kind.brands;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final items = _isBrands
        ? ref.watch(adminBrandsProvider)
        : ref.watch(adminCategoriesProvider);

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 640),
        child: Column(children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(children: [
              Expanded(
                child: TextField(
                  controller: _nameController,
                  decoration: InputDecoration(
                    labelText: _isBrands
                        ? 'New brand name'
                        : 'New category name',
                  ),
                  onSubmitted: (_) => _add(),
                ),
              ),
              const SizedBox(width: 12),
              FilledButton.icon(
                icon: const Icon(Icons.add),
                label: const Text('Add'),
                onPressed: _adding ? null : _add,
              ),
            ]),
          ),
          Expanded(
            child: items.when(
              loading: () =>
                  const Center(child: CircularProgressIndicator()),
              error: (error, _) => ErrorRetryView(
                  message: error.toString(),
                  onRetry: () => ref.invalidate(_isBrands
                      ? adminBrandsProvider
                      : adminCategoriesProvider)),
              data: (list) {
                if (list.isEmpty) {
                  return EmptyView(
                      icon: _isBrands
                          ? Icons.branding_watermark_outlined
                          : Icons.category_outlined,
                      title: _isBrands
                          ? 'No brands yet'
                          : 'No categories yet');
                }
                return ListView.separated(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: list.length,
                  separatorBuilder: (_, _) =>
                      const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final item = list[index];
                    return ListTile(
                      title: Text(item.name),
                      subtitle: Text(item.slug),
                      trailing: Row(mainAxisSize: MainAxisSize.min,
                          children: [
                            Text('${item.productCount} products'),
                            IconButton(
                              icon: Icon(Icons.delete_outline,
                                  color: Theme.of(context)
                                      .colorScheme
                                      .error),
                              onPressed: () =>
                                  _delete(context, item.id, item.name),
                            ),
                          ]),
                    );
                  },
                );
              },
            ),
          ),
        ]),
      ),
    );
  }

  Future<void> _add() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) return;

    setState(() => _adding = true);
    final messenger = ScaffoldMessenger.of(context);
    final repo = ref.read(adminRepositoryProvider);

    try {
      if (_isBrands) {
        await repo.createBrand(name);
      } else {
        await repo.createCategory(name);
      }
      _nameController.clear();
      ref.invalidate(_isBrands
          ? adminBrandsProvider
          : adminCategoriesProvider);
    } on ApiError catch (e) {
      messenger.showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      messenger.showSnackBar(const SnackBar(content: Text('Could not add')));
    } finally {
      if (mounted) setState(() => _adding = false);
    }
  }

  Future<void> _delete(
      BuildContext context, String id, String name) async {
    final messenger = ScaffoldMessenger.of(context);
    final repo = ref.read(adminRepositoryProvider);

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(_isBrands ? 'Delete brand?' : 'Delete category?'),
        content: Text('"$name" will be removed.'),
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
      if (_isBrands) {
        await repo.deleteBrand(id);
      } else {
        await repo.deleteCategory(id);
      }
      ref.invalidate(_isBrands
          ? adminBrandsProvider
          : adminCategoriesProvider);
    } on ApiError catch (e) {
      messenger.showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      messenger.showSnackBar(const SnackBar(
          content: Text(
              'Could not delete — it may still have products.')));
    }
  }
}
