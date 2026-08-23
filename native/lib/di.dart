import 'dart:io' show Platform;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;

import 'core/config.dart';
import 'data/repositories/admin_repository.dart';
import 'data/repositories/cart_repository.dart';
import 'data/repositories/catalog_repository.dart';
import 'data/repositories/order_repository.dart';
import 'data/services/api_client.dart';
import 'data/services/auth_service.dart';
import 'data/services/session_store.dart';

final configProvider = Provider<AppConfig>((ref) => AppConfig.fromEnv());

final sessionStoreProvider = Provider<SessionStore>((ref) {
  if (Platform.environment.containsKey('FLUTTER_TEST')) {
    return InMemorySessionStore();
  }
  return SecureSessionStore();
});

final httpClientProvider = Provider<http.Client>((ref) => http.Client());

final apiClientProvider =
    Provider<ApiClient>((ref) => ApiClient(
          ref.watch(httpClientProvider),
          ref.watch(sessionStoreProvider),
        ));

final authServiceProvider = Provider<AuthService>((ref) {
  final config = ref.watch(configProvider);
  return AuthService(
    ref.watch(httpClientProvider),
    ref.watch(sessionStoreProvider),
    Uri.parse(config.authBaseUrl),
  );
});

final catalogRepositoryProvider = Provider<CatalogRepository>(
    (ref) => CatalogRepository(
        ref.watch(apiClientProvider), ref.watch(configProvider)));

final cartRepositoryProvider = Provider<CartRepository>((ref) =>
    CartRepository(
        ref.watch(apiClientProvider), ref.watch(configProvider)));

final orderRepositoryProvider = Provider<OrderRepository>((ref) =>
    OrderRepository(
        ref.watch(apiClientProvider), ref.watch(configProvider)));

final adminRepositoryProvider = Provider<AdminRepository>((ref) =>
    AdminRepository(
        ref.watch(apiClientProvider), ref.watch(configProvider)));
