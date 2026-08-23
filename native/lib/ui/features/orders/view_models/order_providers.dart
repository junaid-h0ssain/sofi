import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../../di.dart';
import '../../../../../data/models/order.dart';
import '../../auth/view_models/auth_controller.dart';

final ordersProvider =
    FutureProvider.autoDispose<List<OrderSummary>>((ref) async {
  final auth = ref.watch(authControllerProvider);
  if (!auth.authenticated) return const [];
  return ref.watch(orderRepositoryProvider).list();
});

final orderDetailProvider =
    FutureProvider.autoDispose.family<OrderDetail, String>((ref, id) {
  return ref.watch(orderRepositoryProvider).byId(id);
});
