import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Persists the better-auth session token and the signed-in user snapshot.
abstract class SessionStore {
  Future<void> save({required String token, required String userJson});
  Future<String?> token();
  Future<String?> userJson();
  Future<void> clear();
}

class SecureSessionStore implements SessionStore {
  static const _tokenKey = 'better_auth_session_token';
  static const _userKey = 'better_auth_user_json';

  final FlutterSecureStorage _storage;

  SecureSessionStore([FlutterSecureStorage? storage])
      : _storage = storage ?? const FlutterSecureStorage();

  @override
  Future<void> save({
    required String token,
    required String userJson,
  }) async {
    await _storage.write(key: _tokenKey, value: token);
    await _storage.write(key: _userKey, value: userJson);
  }

  @override
  Future<String?> token() => _storage.read(key: _tokenKey);

  @override
  Future<String?> userJson() => _storage.read(key: _userKey);

  @override
  Future<void> clear() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _userKey);
  }
}

class InMemorySessionStore implements SessionStore {
  String? _token;
  String? _user;

  @override
  Future<void> save({
    required String token,
    required String userJson,
  }) async {
    _token = token;
    _user = userJson;
  }

  @override
  Future<String?> token() async => _token;

  @override
  Future<String?> userJson() async => _user;

  @override
  Future<void> clear() async {
    _token = null;
    _user = null;
  }
}
