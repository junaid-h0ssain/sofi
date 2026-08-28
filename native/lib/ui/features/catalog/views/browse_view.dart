import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../di.dart';
import '../../../../core/widgets/status_views.dart';
import '../../../core/product_card.dart';
import '../view_models/browse_controller.dart';
import '../view_models/catalog_providers.dart';
import 'product_detail_view.dart';

class BrowseView extends ConsumerWidget {
  const BrowseView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(browseControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Shop'),
        actions: [
          IconButton(
            tooltip: 'Filters',
            icon: Badge(
              isLabelVisible:
                  ref.read(browseControllerProvider.notifier).filter.hasActiveFilters,
              child: const Icon(Icons.tune),
            ),
            onPressed: () => _openFilterSheet(context, ref),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: LayoutBuilder(builder: (context, constraints) {
        final showSidebar = constraints.maxWidth >= 900;

        if (showSidebar) {
          return Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SizedBox(width: 280, child: FilterPanel()),
              const VerticalDivider(width: 1),
              Expanded(child: _results(context, ref, state)),
            ],
          );
        }

        return Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: _SearchField(
                initialQ: ref
                    .read(browseControllerProvider.notifier)
                    .filter
                    .q,
                onSubmitted: (q) => ref
                    .read(browseControllerProvider.notifier)
                    .applyFilter(ref
                        .read(browseControllerProvider.notifier)
                        .filter
                        .copyWith(q: q)),
              ),
            ),
            Expanded(child: _results(context, ref, state)),
          ],
        );
      }),
    );
  }

  void _openFilterSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => SizedBox(
        height: MediaQuery.sizeOf(context).height * 0.75,
        child: FilterPanel(),
      ),
    );
  }
}

Widget _results(BuildContext context, WidgetRef ref, BrowseState state) {
  if (state.loading && state.products.isEmpty) {
    return const Center(child: CircularProgressIndicator());
  }
  if (state.error != null && state.products.isEmpty) {
    return ErrorRetryView(
        message: state.error!, onRetry: () => _retry(ref));
  }
  if (state.products.isEmpty) {
    return const EmptyView(
      icon: Icons.search_off,
      title: 'No products match',
      subtitle: 'Try adjusting your search or filters.',
    );
  }

  return Center(
    child: ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 1400),
      child: Column(
        children: [
          Expanded(
            child: NotificationListener<ScrollNotification>(
              onNotification: (notification) {
                if (notification.metrics.pixels >=
                    notification.metrics.maxScrollExtent - 400) {
                  ref.read(browseControllerProvider.notifier).loadMore();
                }
                return false;
              },
              child: GridView.builder(
                padding: const EdgeInsets.all(16),
                gridDelegate:
                    const SliverGridDelegateWithMaxCrossAxisExtent(
                        maxCrossAxisExtent: 260,
                        mainAxisExtent: 300,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12),
                itemCount: state.products.length,
                itemBuilder: (context, index) => ProductCard(
                  config: ref.watch(configProvider),
                  product: state.products[index],
                  onTap: () =>
                      _openProduct(context, state.products[index].slug),
                ),
              ),
            ),
          ),
          _footer(context, ref, state),
        ],
      ),
    ),
  );
}

Widget _footer(BuildContext context, WidgetRef ref, BrowseState state) {
  final theme = Theme.of(context);
  if (state.loadingMore) {
    return const Padding(
        padding: EdgeInsets.all(12),
        child: CircularProgressIndicator());
  }
  if (state.hasMore) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: FilledButton.tonal(
        onPressed: () =>
            ref.read(browseControllerProvider.notifier).loadMore(),
        child: const Text('Load more'),
      ),
    );
  }
  return Padding(
    padding: const EdgeInsets.all(12),
    child: Text(
      '${state.total} product${state.total == 1 ? '' : 's'}',
      style: theme.textTheme.bodySmall
          ?.copyWith(color: theme.colorScheme.outline),
    ),
  );
}

void _retry(WidgetRef ref) =>
    ref.read(browseControllerProvider.notifier).retry();

void _openProduct(BuildContext context, String slug) {
  Navigator.of(context)
      .push(MaterialPageRoute(builder: (_) => ProductDetailView(slug: slug)));
}

class _SearchField extends StatefulWidget {
  const _SearchField({required this.onSubmitted, this.initialQ = ''});

  final ValueChanged<String> onSubmitted;
  final String initialQ;

  @override
  State<_SearchField> createState() => _SearchFieldState();
}

class _SearchFieldState extends State<_SearchField> {
  late final TextEditingController _controller =
      TextEditingController(text: widget.initialQ);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _controller,
      decoration: InputDecoration(
        hintText: 'Search products…',
        prefixIcon: const Icon(Icons.search),
        suffixIcon: _controller.text.isEmpty
            ? null
            : IconButton(
                icon: const Icon(Icons.clear),
                onPressed: () {
                  _controller.clear();
                  setState(() {});
                  widget.onSubmitted('');
                },
              ),
      ),
      textInputAction: TextInputAction.search,
      onChanged: (_) => setState(() {}),
      onSubmitted: widget.onSubmitted,
    );
  }
}

class FilterPanel extends ConsumerStatefulWidget {
  const FilterPanel({super.key});

  @override
  ConsumerState<FilterPanel> createState() => _FilterPanelState();
}

class _FilterPanelState extends ConsumerState<FilterPanel> {
  final _minController = TextEditingController();
  final _maxController = TextEditingController();

  @override
  void initState() {
    super.initState();
    final current = ref.read(browseControllerProvider.notifier).filter;
    if (current.min != null) _minController.text = current.min.toString();
    if (current.max != null) _maxController.text = current.max.toString();
  }

  @override
  void dispose() {
    _minController.dispose();
    _maxController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = ref.read(browseControllerProvider.notifier);
    final filter = controller.filter;

    final brands = ref.watch(filterBrandsProvider);
    final categories = ref.watch(filterCategoriesProvider);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          children: [
            Text('Filters',
                style: Theme.of(context).textTheme.titleMedium),
            const Spacer(),
            TextButton(
              onPressed: () {
                setState(() {
                  _minController.clear();
                  _maxController.clear();
                });
                controller.applyFilter(const BrowseFilter());
              },
              child: const Text('Reset'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text('Brands', style: Theme.of(context).textTheme.titleSmall),
        brands.maybeWhen(
          data: (list) => Column(
            children: [
              for (final brand in list)
                CheckboxListTile(
                  dense: true,
                  controlAffinity: ListTileControlAffinity.leading,
                  title: Text(brand.name),
                  value: filter.brands.contains(brand.slug),
                  onChanged: (checked) =>
                      setState(() {
                        final next = Set.of(filter.brands);
                        checked == true
                            ? next.add(brand.slug)
                            : next.remove(brand.slug);
                        controller.applyFilter(filter.copyWith(brands: next));
                      }),
                ),
            ],
          ),
          orElse: () =>
              const Center(child: CircularProgressIndicator()),
        ),
        const SizedBox(height: 12),
        Text('Categories', style: Theme.of(context).textTheme.titleSmall),
        categories.maybeWhen(
          data: (list) => Column(
            children: [
              for (final category in list)
                CheckboxListTile(
                  dense: true,
                  controlAffinity: ListTileControlAffinity.leading,
                  title: Text(category.name),
                  subtitle:
                      Text('${category.productCount} items'),
                  value: filter.categories.contains(category.slug),
                  onChanged: (checked) =>
                      setState(() {
                        final next = Set.of(filter.categories);
                        checked == true
                            ? next.add(category.slug)
                            : next.remove(category.slug);
                        controller.applyFilter(
                            filter.copyWith(categories: next));
                      }),
                ),
            ],
          ),
          orElse: () =>
              const Center(child: CircularProgressIndicator()),
        ),
        const SizedBox(height: 12),
        Text('Price', style: Theme.of(context).textTheme.titleSmall),
        const SizedBox(height: 8),
        Row(children: [
          Expanded(
            child: TextFormField(
              controller: _minController,
              keyboardType: TextInputType.number,
              decoration:
                  const InputDecoration(labelText: 'Min \$'),
            ),
          ),
          const Padding(
              padding: EdgeInsets.symmetric(horizontal: 8),
              child: Text('–')),
          Expanded(
            child: TextFormField(
              controller: _maxController,
              keyboardType: TextInputType.number,
              decoration:
                  const InputDecoration(labelText: 'Max \$'),
            ),
          ),
        ]),
        const SizedBox(height: 20),
        FilledButton.icon(
          icon: const Icon(Icons.check),
          label: const Text('Apply filters'),
          onPressed: () {
            final min =
                num.tryParse(_minController.text.trim());
            final max =
                num.tryParse(_maxController.text.trim());
            controller.applyFilter(filter.copyWith(min: min, max: max));
            if (Navigator.of(context).canPop()) {
              Navigator.of(context).pop();
            }
          },
        ),
      ],
    );
  }
}
