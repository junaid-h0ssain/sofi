import 'dart:io' show Platform;

class AppConfig {
  const AppConfig({
    required this.apiBaseUrl,
    required this.authBaseUrl,
    required this.assetBaseUrl,
  });

  final String apiBaseUrl;
  final String authBaseUrl;

  /// Web origin serving product images (relative paths like /products/laptop.svg).
  final String assetBaseUrl;

  static const _apiOverride = String.fromEnvironment('API_BASE_URL');
  static const _authOverride = String.fromEnvironment('AUTH_BASE_URL');
  static const _assetOverride = String.fromEnvironment('ASSET_BASE_URL');

  static AppConfig fromEnv() {
    return AppConfig(
      apiBaseUrl: _apiOverride.isNotEmpty ? _apiOverride : _defaultApi(),
      authBaseUrl: _authOverride.isNotEmpty ? _authOverride : _defaultAuth(),
      assetBaseUrl: _assetOverride.isNotEmpty ? _assetOverride : _defaultAsset(),
    );
  }

  static String _defaultApi() =>
      Platform.isAndroid ? 'http://10.0.2.2:5080' : 'http://localhost:5080';

  static String _defaultAuth() =>
      Platform.isAndroid ? 'http://10.0.2.2:4000' : 'http://localhost:4000';

  static String _defaultAsset() =>
      Platform.isAndroid ? 'http://10.0.2.2:5173' : 'http://localhost:5173';

  Uri resolveUri(String base, String path) => Uri.parse(base.endsWith('/')
          ? base.substring(0, base.length - 1)
          : base)
      .resolve(path.startsWith('/') ? path : '/$path');
}
