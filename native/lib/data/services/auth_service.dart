import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../core/api_error.dart';
import '../models/auth_user.dart';
import 'session_store.dart';

/// Talks to the better-auth service (Hono) directly.
/// Sign-up/sign-in return the session token in the JSON body; the token is
/// then used as "Authorization: Bearer" against both the .NET API and here.
class AuthService {
  AuthService(this._client, this._sessionStore, this._authBaseUri);

  final http.Client _client;
  final SessionStore _sessionStore;
  final Uri _authBaseUri;

  Future<AuthSession> signUp({
    required String name,
    required String email,
    required String password,
  }) async {
    final json = await _authPost('sign-up/email', {
      'name': name,
      'email': email,
      'password': password,
    });
    return await _persist(_sessionFrom(json));
  }

  Future<AuthSession> signIn({
    required String email,
    required String password,
  }) async {
    final json = await _authPost('sign-in/email', {
      'email': email,
      'password': password,
    });
    return await _persist(_sessionFrom(json));
  }

  /// Returns true when the stored token is still valid server-side.
  Future<bool> validateSession() async {
    final response = await _sendWithToken('GET', 'get-session');
    if (response.statusCode == 200) {
      final body = response.body.trim();
      return body.isNotEmpty && body != 'null' && body != '{}';
    }
    if (response.statusCode == 401) return false;
    throw ApiError(response.statusCode, 'Session check failed');
  }

  Future<void> signOut() async {
    try {
      await _sendWithToken('POST', 'sign-out', body: '{}');
    } finally {
      await _sessionStore.clear();
    }
  }

  Future<AuthSession> _persist(AuthSession session) async {
    await _sessionStore.save(
      token: session.token,
      userJson: jsonEncode(session.user.toJson()),
    );
    return session;
  }

  AuthSession _sessionFrom(Map<String, dynamic> json) {
    final token = json['token'];
    if (token is! String || token.isEmpty) {
      throw ApiError(0, 'Auth service did not return a session token');
    }
    return AuthSession(
      token: token,
      user: AuthUser.fromJson(json['user'] as Map<String, dynamic>),
    );
  }

  Future<Map<String, dynamic>> _authPost(
      String path, Map<String, Object?> body) async {
    final response = await _client.post(
      _uri(path),
      headers: const {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: jsonEncode(body),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiError(response.statusCode, _errorMessage(response));
    }
    if (response.bodyBytes.isEmpty) {
      throw ApiError(response.statusCode, 'Empty auth response');
    }

    try {
      return jsonDecode(utf8.decode(response.bodyBytes))
          as Map<String, dynamic>;
    } on FormatException {
      throw ApiError(response.statusCode, 'Malformed auth response');
    }
  }

  Future<http.Response> _sendWithToken(String method, String path,
      {String? body}) async {
    final headers = <String, String>{'Accept': 'application/json'};
    final token = await _sessionStore.token();
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    final request = http.Request(method, _uri(path))..headers.addAll(headers);
    if (body != null) request.body = body;
    return http.Response.fromStream(await _client.send(request));
  }

  Uri _uri(String path) => _authBaseUri.resolve('/api/auth/$path');
}

String _errorMessage(http.Response response) {
  try {
    final decoded =
        jsonDecode(utf8.decode(response.bodyBytes)) as Map<String, dynamic>?;
    final message = decoded?['message'] ?? decoded?['error'];
    if (message is String && message.isNotEmpty) return message;
  } catch (_) {}
  return 'Authentication failed (${response.statusCode})';
}
