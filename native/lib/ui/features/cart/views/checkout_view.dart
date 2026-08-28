import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/api_error.dart';
import '../../../../di.dart';
import '../../cart/view_models/cart_controller.dart';
import '../../orders/view_models/order_providers.dart';
import 'order_confirmation_view.dart';

class CheckoutView extends ConsumerStatefulWidget {
  const CheckoutView({super.key});

  @override
  ConsumerState<CheckoutView> createState() => _CheckoutViewState();
}

class _CheckoutViewState extends ConsumerState<CheckoutView> {
  final _formKey = GlobalKey<FormState>();
  final _fullName = TextEditingController();
  final _street = TextEditingController();
  final _city = TextEditingController();
  final _postalCode = TextEditingController();
  final _country = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _fullName.dispose();
    _street.dispose();
    _city.dispose();
    _postalCode.dispose();
    _country.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartControllerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 560),
          child: Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                Text('Shipping address',
                    style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _fullName,
                  decoration:
                      const InputDecoration(labelText: 'Full name'),
                  textInputAction: TextInputAction.next,
                  validator: _required,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _street,
                  decoration: const InputDecoration(labelText: 'Street'),
                  textInputAction: TextInputAction.next,
                  validator: _required,
                ),
                const SizedBox(height: 16),
                Row(children: [
                  Expanded(
                    child: TextFormField(
                      controller: _city,
                      decoration:
                          const InputDecoration(labelText: 'City'),
                      textInputAction: TextInputAction.next,
                      validator: _required,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextFormField(
                      controller: _postalCode,
                      decoration: const InputDecoration(
                          labelText: 'Postal code'),
                      textInputAction: TextInputAction.next,
                      validator: _required,
                    ),
                  ),
                ]),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _country,
                  decoration:
                      const InputDecoration(labelText: 'Country'),
                  textInputAction: TextInputAction.done,
                  validator: _required,
                ),
                const SizedBox(height: 24),
                FilledButton.icon(
                  icon: _submitting
                      ? const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.payment),
                  label: Text(_submitting
                      ? 'Placing order…'
                      : 'Place order · ${_subtotalLabel(cart)}'),
                  onPressed:
                      _submitting || cart.items.isEmpty ? null : _placeOrder,
                ),
                const SizedBox(height: 8),
                Text('Mock payment — the order is confirmed instantly.',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.outline)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String? _required(String? value) =>
      value == null || value.trim().isEmpty ? 'Required' : null;

  String _subtotalLabel(CartState cart) {
    final subtotal =
        cart.items.fold(0, (s, i) => s + i.product.priceCents * i.quantity);
    return (subtotal / 100).toStringAsFixed(2);
  }

  Future<void> _placeOrder() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _submitting = true);
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);

    try {
      final orderId = await ref.read(orderRepositoryProvider).place(
            fullName: _fullName.text,
            street: _street.text,
            city: _city.text,
            postalCode: _postalCode.text,
            country: _country.text,
          );

      ref.invalidate(ordersProvider);
      await ref.read(cartControllerProvider.notifier).load();

      if (!mounted) return;
      navigator.pushReplacement(MaterialPageRoute(
          builder: (_) => OrderConfirmationView(orderId: orderId)));
    } on ApiError catch (e) {
      setState(() => _submitting = false);
      messenger.showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      setState(() => _submitting = false);
      messenger.showSnackBar(const SnackBar(
          content: Text('Could not place the order. Try again.')));
    }
  }
}
