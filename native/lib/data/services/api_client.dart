import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../core/api_error.dart';
import 'session_store.dart';

class ApiClient {
  ApiClient(this._client, this._sessionStore);

  final http.Client _client;
  final SessionStore _sessionStore;

  Future<Map<String, dynamic>> getMap(Uri uri) async =>
      _decodeJson(await _send('GET', uri));

  Future<List<dynamic>> getList(Uri uri) async =>
      _decodeList(await _send('GET', uri));

  Future<Map<String, dynamic>> post(Uri uri, {Object? body}) async =>
      _decodeJson(await _send('POST', uri, body: body));

  Future<void> postVoid(Uri uri, {Object? body}) async =>
      await _send('POST', uri, body: body);

  Future<void> putVoid(Uri uri, {Object? body}) async =>
      await _send('PUT', uri, body: body);

  Future<void> deleteVoid(Uri uri) async => await _send('DELETE', uri);

  Future<http.Response> _send(String method, Uri uri, {Object? body}) async {
    final headers = <String, String>{'Accept': 'application/json'};
    if (body != null) headers['Content-Type'] = 'application/json';

    final token = await _sessionStore.token();
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }

    final response = await _client.send(http.Request(method, uri)
      ..headers.addAll(headers)
      ..body = body == null ? '' : jsonEncode(body));

    return http.Response.fromStream(response);
  }

  Map<String, dynamic> _decodeJson(http.Response response) {
    _throwOnError(response);
    if (response.bodyBytes.isEmpty) return const {};
    return jsonDecode(utf8.decode(response.bodyBytes)) as Map<String, dynamic>;
  }

  List<dynamic> _decodeList(http.Response response) {
    _throwOnError(response);
    if (response.bodyBytes.isEmpty) return const [];
    return jsonDecode(utf8.decode(response.bodyBytes)) as List<dynamic>;
  }

  void _throwOnError(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) return;

    String message = 'Request failed (${response.statusCode})';
    try {
      final decoded = jsonDecode(response.body);
      if (decoded is Map<String, dynamic> && decoded['message'] is String) {
        message = decoded['message'] as String;
      }
    } catch (_) {}

    throw ApiError(response.statusCode, message);
  }
}
