import '../../core/config.dart';
import '../models/cart.dart';
import '../services/api_client.dart';

class CartRepository {
  CartRepository(this._client, this._config);

  final ApiClient _client;
  final AppConfig _config;

  Uri _cartUri([String suffix = '']) =>
      _config.resolveUri(_config.apiBaseUrl, '/api/v1/cart$suffix');

  Future<List<CartItem>> items() async {
    final json = await _client.getList(_cartUri());
    return json
        .map((e) => CartItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> add(String productId, int quantity) =>
      _client.postVoid(_cartUri('/items'), body: {
        'productId': productId,
        'quantity': quantity,
      });

  Future<void> setQuantity(String itemId, int quantity) =>
      _client.putVoid(_cartUri('/items/$itemId'), body: {
        'quantity': quantity,
      });

  Future<void> remove(String itemId) =>
      _client.deleteVoid(_cartUri('/items/$itemId'));

  Future<void> clear() => _client.deleteVoid(_cartUri());
}
