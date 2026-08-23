import '../../core/api_error.dart';
import '../../core/config.dart';
import '../models/admin.dart';
import '../models/product_input.dart';
import '../services/api_client.dart';

class AdminRepository {
  AdminRepository(this._client, this._config);

  final ApiClient _client;
  final AppConfig _config;

  Uri _uri(String path) =>
      _config.resolveUri(_config.apiBaseUrl, '/api/v1/admin$path');

  Future<AdminStats> stats() async {
    final json = await _client.getMap(_uri('/products/stats'));
    return AdminStats.fromJson(json);
  }

  Future<List<AdminProductRow>> products() async {
    final json = await _client.getList(_uri('/products'));
    return json
        .map((e) => AdminProductRow.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<ProductInput?> product(String id) async {
    try {
      final json = await _client.getMap(_uri('/products/$id'));
      return ProductInput(
        name: json['name'] as String,
        description: json['description'] as String? ?? '',
        price: (json['priceCents'] as int) / 100,
        stock: json['stock'] as int,
        brandId: (json['brand'] as Map<String, dynamic>)['id'] as String,
        categoryId:
            (json['category'] as Map<String, dynamic>)['id'] as String,
        imageUrl: json['imageUrl'] as String?,
        featured: json['featured'] as bool? ?? false,
        specs: (json['specs'] as Map<String, dynamic>? ?? {})
            .map((k, v) => MapEntry(k, v as String)),
      );
    } on ApiError catch (e) {
      if (e.statusCode == 404) return null;
      rethrow;
    }
  }

  Future<void> createProduct(ProductInput input) =>
      _client.postVoid(_uri('/products'), body: input.toBody());

  Future<void> updateProduct(String id, ProductInput input) =>
      _client.putVoid(_uri('/products/$id'), body: input.toBody());

  Future<void> deleteProduct(String id) =>
      _client.deleteVoid(_uri('/products/$id'));

  Future<List<TaxonomyWithCount>> brands() async {
    final json = await _client.getList(_uri('/brands'));
    return json
        .map((e) => TaxonomyWithCount.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> createBrand(String name) =>
      _client.postVoid(_uri('/brands'), body: {'name': name});

  Future<void> deleteBrand(String id) =>
      _client.deleteVoid(_uri('/brands/$id'));

  Future<List<TaxonomyWithCount>> categories() async {
    final json = await _client.getList(_uri('/categories'));
    return json
        .map((e) => TaxonomyWithCount.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> createCategory(String name) =>
      _client.postVoid(_uri('/categories'), body: {'name': name});

  Future<void> deleteCategory(String id) =>
      _client.deleteVoid(_uri('/categories/$id'));
}
