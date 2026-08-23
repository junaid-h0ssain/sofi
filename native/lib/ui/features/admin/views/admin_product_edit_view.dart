import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/api_error.dart';
import '../../../../data/models/product_input.dart';
import '../../../../di.dart';
import '../view_models/admin_providers.dart';

class AdminProductEditView extends ConsumerStatefulWidget {
  const AdminProductEditView({super.key, this.productId});

  final String? productId;

  @override
  ConsumerState<AdminProductEditView> createState() =>
      _AdminProductEditViewState();
}

class _AdminProductEditViewState
    extends ConsumerState<AdminProductEditView> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _description = TextEditingController();
  final _price = TextEditingController();
  final _stock = TextEditingController();
  final _imageUrl = TextEditingController();

  String? _brandId;
  String? _categoryId;
  bool _featured = false;
  List<MapEntry<String, String>> _specs = [];

  bool _loading = true;
  bool _saving = false;

  bool get _isEdit => widget.productId != null;

  @override
  void initState() {
    super.initState();
    _loadInitial();
  }

  Future<void> _loadInitial() async {
    try {
      if (_isEdit) {
        final input = await ref
            .read(adminRepositoryProvider)
            .product(widget.productId!);
        if (input != null) {
          _name.text = input.name;
          _description.text = input.description;
          _price.text = input.price.toString();
          _stock.text = '${input.stock}';
          _imageUrl.text = input.imageUrl ?? '';
          _brandId = input.brandId;
          _categoryId = input.categoryId;
          _featured = input.featured;
          _specs =
              input.specs.entries.map((e) => MapEntry(e.key, e.value)).toList();
        }
      }
    } catch (_) {
      // surfaced via snackbar below on save attempt; keep form blank
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    for (final c in [_name, _description, _price, _stock, _imageUrl]) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final brands = ref.watch(adminBrandsProvider);
    final categories = ref.watch(adminCategoriesProvider);

    return Scaffold(
      appBar: AppBar(
          title: Text(_isEdit ? 'Edit product' : 'New product')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 640),
                child: Form(
                  key: _formKey,
                  child: ListView(padding: const EdgeInsets.all(20),
                      children: [
                    TextFormField(
                      controller: _name,
                      decoration:
                          const InputDecoration(labelText: 'Name'),
                      textInputAction: TextInputAction.next,
                      validator: _required,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _description,
                      decoration: const InputDecoration(
                          labelText: 'Description',
                          alignLabelWithHint: true),
                      minLines: 3,
                      maxLines: 5,
                    ),
                    const SizedBox(height: 16),
                    Row(children: [
                      Expanded(
                        child: TextFormField(
                          controller: _price,
                          keyboardType: const TextInputType.numberWithOptions(
                              decimal: true),
                          decoration: const InputDecoration(
                              labelText: 'Price (\$)'),
                          validator: (v) =>
                              num.tryParse(v ?? '') == null
                                  ? 'Enter a number'
                                  : null,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: TextFormField(
                          controller: _stock,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                              labelText: 'Stock'),
                          validator: (v) =>
                              int.tryParse(v ?? '') == null
                                  ? 'Enter a whole number'
                                  : null,
                        ),
                      ),
                    ]),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _imageUrl,
                      decoration: const InputDecoration(
                          labelText: 'Image URL (optional)'),
                    ),
                    const SizedBox(height: 16),
                    brands.maybeWhen(
                      data: (list) => DropdownButtonFormField<String>(
                        initialValue: _brandId,
                        decoration:
                            const InputDecoration(labelText: 'Brand'),
                        items: [
                          for (final b in list)
                            DropdownMenuItem(
                                value: b.id, child: Text(b.name)),
                        ],
                        onChanged: (value) =>
                            setState(() => _brandId = value),
                        validator: (v) =>
                            v == null ? 'Select a brand' : null,
                      ),
                      orElse: () => const LinearProgressIndicator(),
                    ),
                    const SizedBox(height: 16),
                    categories.maybeWhen(
                      data: (list) => DropdownButtonFormField<String>(
                        initialValue: _categoryId,
                        decoration: const InputDecoration(
                            labelText: 'Category'),
                        items: [
                          for (final c in list)
                            DropdownMenuItem(
                                value: c.id, child: Text(c.name)),
                        ],
                        onChanged: (value) =>
                            setState(() => _categoryId = value),
                        validator: (v) =>
                            v == null ? 'Select a category' : null,
                      ),
                      orElse: () => const LinearProgressIndicator(),
                    ),
                    const SizedBox(height: 8),
                    SwitchListTile(
                      title: const Text('Featured'),
                      subtitle:
                          const Text('Show on the homepage'),
                      value: _featured,
                      onChanged: (value) =>
                          setState(() => _featured = value),
                    ),
                    const SizedBox(height: 12),
                    Row(children: [
                      Text('Specifications',
                          style:
                              Theme.of(context).textTheme.titleSmall),
                      const Spacer(),
                      TextButton.icon(
                        icon: const Icon(Icons.add, size: 18),
                        label: const Text('Add spec'),
                        onPressed: () => setState(() =>
                            _specs.add(const MapEntry('', ''))),
                      ),
                    ]),
                    for (var i = 0; i < _specs.length; i++)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(children: [
                          Expanded(
                            child: TextFormField(
                              initialValue: _specs[i].key,
                              decoration: const InputDecoration(
                                  hintText: 'Key (e.g. RAM)'),
                              onChanged: (value) => _specs[i] =
                                  MapEntry(value, _specs[i].value),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: TextFormField(
                              initialValue: _specs[i].value,
                              decoration: const InputDecoration(
                                  hintText: 'Value (e.g. 16 GB)'),
                              onChanged: (value) => _specs[i] =
                                  MapEntry(_specs[i].key, value),
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close, size: 18),
                            onPressed: () =>
                                setState(() => _specs.removeAt(i)),
                          ),
                        ]),
                      ),
                    const SizedBox(height: 24),
                    FilledButton.icon(
                      icon: _saving
                          ? const SizedBox(
                              height: 18,
                              width: 18,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2))
                          : const Icon(Icons.save_outlined),
                      label:
                          Text(_isEdit ? 'Save changes' : 'Create product'),
                      onPressed: _saving ? null : _save,
                    ),
                  ]),
                ),
              ),
            ),
    );
  }

  String? _required(String? value) =>
      value == null || value.trim().isEmpty ? 'Required' : null;

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    final specs = <String, String>{
      for (final entry in _specs)
        if (entry.key.trim().isNotEmpty)
          entry.key.trim(): entry.value.trim(),
    };

    final input = ProductInput(
      name: _name.text,
      description: _description.text,
      price: num.tryParse(_price.text) ?? 0,
      stock: int.tryParse(_stock.text) ?? 0,
      brandId: _brandId!,
      categoryId: _categoryId!,
      imageUrl: _imageUrl.text.trim().isEmpty
          ? null
          : _imageUrl.text.trim(),
      featured: _featured,
      specs: specs,
    );

    setState(() => _saving = true);
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);

    try {
      if (_isEdit) {
        await ref
            .read(adminRepositoryProvider)
            .updateProduct(widget.productId!, input);
      } else {
        await ref.read(adminRepositoryProvider).createProduct(input);
      }
      ref.invalidate(adminProductsProvider);
      ref.invalidate(adminStatsProvider);

      if (!mounted) return;
      navigator.pop();
    } on ApiError catch (e) {
      setState(() => _saving = false);
      messenger.showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      setState(() => _saving = false);
      messenger.showSnackBar(const SnackBar(
          content: Text('Could not save the product')));
    }
  }
}
