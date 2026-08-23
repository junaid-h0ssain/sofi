import 'catalog.dart';

class CartItem {
  const CartItem({
    required this.id,
    required this.quantity,
    required this.product,
  });

  final String id;
  final int quantity;
  final Product product;

  factory CartItem.fromJson(Map<String, dynamic> json) => CartItem(
        id: json['id'] as String,
        quantity: json['quantity'] as int,
        product:
            Product.fromJson(json['product'] as Map<String, dynamic>),
      );
}
