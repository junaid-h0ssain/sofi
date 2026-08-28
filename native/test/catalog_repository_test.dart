import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/core/api_error.dart';
import 'package:mobile/core/config.dart';
import 'package:mobile/data/repositories/catalog_repository.dart';
import 'package:mobile/data/services/api_client.dart';
import 'package:mobile/data/services/session_store.dart';

AppConfig get testConfig => const AppConfig(
      apiBaseUrl: 'http://api.test',
      authBaseUrl: 'http://auth.test',
      assetBaseUrl: 'http://web.test',
    );

void main() {
  group('CatalogRepository.list', () {
    test('builds repeated brand/category query params', () async {
      Uri? capturedUri;

      final client = MockClient((request) async {
        capturedUri = request.url;
        return http.Response(
          jsonEncode({
            'items': [],
            'total': 0,
            'page': 1,
            'pages': 1,
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      });

      final repo = CatalogRepository(
        ApiClient(client, InMemorySessionStore()),
        testConfig,
      );

      await repo.list(
        q: 'laptop',
        brands: ['apple', 'sony'],
        categories: ['laptop'],
        sort: 'price-asc',
        min: 100,
        max: 2000.5,
        page: 3,
      );

      expect(capturedUri!.host, 'api.test');
      expect(capturedUri!.path, '/api/v1/products');
      expect(capturedUri!.queryParameters['q'], 'laptop');
      expect(capturedUri!.queryParametersAll['brand'],
          ['apple', 'sony']);
      expect(capturedUri!.queryParametersAll['category'], ['laptop']);
      expect(capturedUri!.queryParameters['sort'], 'price-asc');
      expect(capturedUri!.queryParameters['min'], '100');
      expect(capturedUri!.queryParameters['max'], '2000.5');
      expect(capturedUri!.queryParameters['page'], '3');
    });

    test('omits empty filters from the query', () async {
      Uri? capturedUri;

      final client = MockClient((request) async {
        capturedUri = request.url;
        return http.Response(
          jsonEncode({'items': [], 'total': 0, 'page': 1, 'pages': 1}),
          200,
        );
      });

      final repo = CatalogRepository(
        ApiClient(client, InMemorySessionStore()),
        testConfig,
      );

      await repo.list();

      expect(capturedUri!.queryParameters.containsKey('q'), isFalse);
      expect(capturedUri!.queryParameters.containsKey('brand'), isFalse);
      expect(capturedUri!.queryParameters['page'], '1');
    });
  });

  group('ApiClient error mapping', () {
    test('surfaces the API {message} as ApiError', () async {
      final client = MockClient((request) async =>
          http.Response('{"message":"Insufficient stock for Mouse (0 left)"}',
              400));

      final repo = CatalogRepository(
        ApiClient(client, InMemorySessionStore()),
        testConfig,
      );

      expect(
        () => repo.bySlug('mouse'),
        throwsA(isA<ApiError>()
            .having((e) => e.statusCode, 'statusCode', 400)
            .having((e) => e.message, 'message',
                'Insufficient stock for Mouse (0 left)')),
      );
    });

    test('404 on unknown product', () async {
      final client = MockClient(
          (request) async => http.Response('{"message":"Product not found"}', 404));

      final repo = CatalogRepository(
        ApiClient(client, InMemorySessionStore()),
        testConfig,
      );

      expect(() => repo.bySlug('nope'),
          throwsA(isA<ApiError>().having((e) => e.statusCode, 'code', 404)));
    });
  });

  group('ApiClient auth header', () {
    test('sends stored token as Bearer', () async {
      final store = InMemorySessionStore();
      await store.save(token: 'tok123', userJson: '{}');

      String? authHeader;
      final client = MockClient((request) async {
        authHeader = request.headers['Authorization'];
        return http.Response('[]', 200);
      });

      final repo = CatalogRepository(ApiClient(client, store), testConfig);
      await repo.brands();

      expect(authHeader, 'Bearer tok123');
    });
  });
}
