import '../../core/config.dart';
import '../models/admin.dart';
import '../models/catalog.dart';
import '../services/api_client.dart';

class CatalogRepository {
  CatalogRepository(this._client, this._config);

  final ApiClient _client;
  final AppConfig _config;

  Uri _uri(String path, [Map<String, Object?>? query]) {
    final base =
        _config.resolveUri(_config.apiBaseUrl, '/api/v1$path');
    if (query == null || query.isEmpty) return base;
    return base.replace(queryParameters: query);
  }

  Future<List<Product>> featured({int limit = 8}) async {
    final json = await _client.getList(
        _uri('/products/featured', {'limit': [limit.toString()]}));
    return json
        .map((e) => Product.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<PagedProducts> list({
    String? q,
    List<String> brands = const [],
    List<String> categories = const [],
    String? sort,
    num? min,
    num? max,
    int page = 1,
  }) async {
    final query = <String, Object?>{
      if (q != null && q.isNotEmpty) 'q': q,
      if (brands.isNotEmpty) 'brand': brands,
      if (categories.isNotEmpty) 'category': categories,
      if (sort != null && sort.isNotEmpty) 'sort': sort,
      if (min != null) 'min': min.toString(),
      if (max != null) 'max': max.toString(),
      'page': page.toString(),
    };
    final json = await _client.getMap(_uri('/products', query));
    return PagedProducts.fromJson(json);
  }

  Future<Product> bySlug(String slug) async {
    final json =
        await _client.getMap(_uri('/products/$slug'));
    return Product.fromJson(json);
  }

  Future<List<Product>> related(String slug, {int limit = 4}) async {
    final json = await _client.getList(
        _uri('/products/$slug/related', {'limit': [limit.toString()]}));
    return json
        .map((e) => Product.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<Brand>> brands() async {
    final json = await _client.getList(_uri('/brands'));
    return json.map((e) => Brand.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<TaxonomyWithCount>> categories() async {
    final json = await _client.getList(_uri('/categories'));
    return json
        .map((e) => TaxonomyWithCount.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
