import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/api_error.dart';
import '../../../../data/models/auth_user.dart';
import '../../../../di.dart';

enum AuthStatus { loading, unauthenticated, authenticated }

class AuthState {
  const AuthState({
    required this.status,
    this.user,
    this.isAdmin = false,
    this.busy = false,
  });

  const AuthState.loading() : this(status: AuthStatus.loading);

  const AuthState.unauthenticated()
      : this(status: AuthStatus.unauthenticated);

  final AuthStatus status;
  final AuthUser? user;
  final bool isAdmin;

  /// True while a sign-in/up/out request is in flight.
  final bool busy;

  bool get authenticated => status == AuthStatus.authenticated;

  AuthState copyWith({
    AuthStatus? status,
    AuthUser? user,
    bool? isAdmin,
    bool? busy,
    bool clearUser = false,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: clearUser ? null : (user ?? this.user),
      isAdmin: isAdmin ?? this.isAdmin,
      busy: busy ?? this.busy,
    );
  }
}

class AuthController extends Notifier<AuthState> {
  @override
  AuthState build() {
    scheduleMicrotask(_restore);
    return const AuthState.loading();
  }

  Future<void> _restore() async {
    final store = ref.read(sessionStoreProvider);
    final token = await store.token();
    final userJson = await store.userJson();

    if (token == null || token.isEmpty || userJson == null) {
      state = const AuthState.unauthenticated();
      return;
    }

    try {
      state = AuthState(
        status: AuthStatus.authenticated,
        user: AuthUser.fromJsonString(userJson),
      );
    } on FormatException {
      await store.clear();
      state = const AuthState.unauthenticated();
      return;
    }

    _probeAdmin();
    _validateInBackground();
  }

  Future<void> _validateInBackground() async {
    try {
      final valid =
          await ref.read(authServiceProvider).validateSession();
      if (!valid) await signOut();
    } catch (_) {
      // Network hiccup — keep the optimistic session.
    }
  }

  Future<void> _probeAdmin() async {
    try {
      await ref.read(adminRepositoryProvider).stats();
      state = state.copyWith(isAdmin: true);
    } on ApiError catch (e) {
      if (e.statusCode == 401) await signOut();
    } catch (_) {
      state = state.copyWith(isAdmin: false);
    }
  }

  Future<void> signIn(String email, String password) async {
    state = state.copyWith(busy: true);
    try {
      final session =
          await ref.read(authServiceProvider).signIn(
                email: email.trim(),
                password: password,
              );
      state = AuthState(status: AuthStatus.authenticated, user: session.user);
      _probeAdmin();
    } on ApiError {
      state = state.copyWith(busy: false);
      rethrow;
    } catch (_) {
      state = state.copyWith(busy: false);
      rethrow;
    }
  }

  Future<void> signUp(String name, String email, String password) async {
    state = state.copyWith(busy: true);
    try {
      final session =
          await ref.read(authServiceProvider).signUp(
                name: name.trim(),
                email: email.trim(),
                password: password,
              );
      state = AuthState(status: AuthStatus.authenticated, user: session.user);
      _probeAdmin();
    } catch (_) {
      state = state.copyWith(busy: false);
      rethrow;
    }
  }

  Future<void> signOut() async {
    final auth = ref.read(authServiceProvider);
    state = const AuthState.unauthenticated();
    try {
      await auth.signOut();
    } catch (_) {}
  }
}

final authControllerProvider =
    NotifierProvider<AuthController, AuthState>(AuthController.new);
