import '../../core/config.dart';
import '../models/order.dart';
import '../services/api_client.dart';

class OrderRepository {
  OrderRepository(this._client, this._config);

  final ApiClient _client;
  final AppConfig _config;

  Uri _uri([String path = '']) =>
      _config.resolveUri(_config.apiBaseUrl, '/api/v1/orders$path');

  /// Places the order and returns its id (API responds 201 {orderId}).
  Future<String> place({
    required String fullName,
    required String street,
    required String city,
    required String postalCode,
    required String country,
  }) async {
    final json = await _client.post(
      _config.resolveUri(
          _config.apiBaseUrl, '/api/v1/checkout/orders'),
      body: {
        'fullName': fullName,
        'street': street,
        'city': city,
        'postalCode': postalCode,
        'country': country,
      },
    );
    return json['orderId'] as String;
  }

  Future<List<OrderSummary>> list() async {
    final json = await _client.getList(_uri());
    return json
        .map((e) => OrderSummary.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<OrderDetail> byId(String id) async {
    final json = await _client.getMap(_uri('/$id'));
    return OrderDetail.fromJson(json);
  }
}
