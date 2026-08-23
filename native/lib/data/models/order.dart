class OrderItemModel {
  const OrderItemModel({
    required this.id,
    required this.productName,
    required this.unitPriceCents,
    required this.quantity,
    required this.imageUrl,
  });

  final String id;
  final String productName;
  final int unitPriceCents;
  final int quantity;
  final String? imageUrl;

  factory OrderItemModel.fromJson(Map<String, dynamic> json) => OrderItemModel(
        id: json['id'] as String,
        productName: json['productName'] as String,
        unitPriceCents: json['unitPriceCents'] as int,
        quantity: json['quantity'] as int,
        imageUrl: json['imageUrl'] as String?,
      );
}

class OrderSummary {
  const OrderSummary({
    required this.id,
    required this.status,
    required this.totalCents,
    required this.shippingCents,
    required this.city,
    required this.country,
    required this.createdAt,
  });

  final String id;
  final String status;
  final int totalCents;
  final int shippingCents;
  final String city;
  final String country;
  final DateTime createdAt;

  factory OrderSummary.fromJson(Map<String, dynamic> json) => OrderSummary(
        id: json['id'] as String,
        status: json['status'] as String,
        totalCents: json['totalCents'] as int,
        shippingCents: json['shippingCents'] as int,
        city: json['city'] as String,
        country: json['country'] as String,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}

class OrderDetail {
  const OrderDetail({
    required this.id,
    required this.userId,
    required this.status,
    required this.totalCents,
    required this.shippingCents,
    required this.fullName,
    required this.street,
    required this.city,
    required this.postalCode,
    required this.country,
    required this.createdAt,
    required this.items,
  });

  final String id;
  final String userId;
  final String status;
  final int totalCents;
  final int shippingCents;
  final String fullName;
  final String street;
  final String city;
  final String postalCode;
  final String country;
  final DateTime createdAt;
  final List<OrderItemModel> items;

  int get subtotalCents =>
      items.fold(0, (sum, i) => sum + i.unitPriceCents * i.quantity);

  factory OrderDetail.fromJson(Map<String, dynamic> json) => OrderDetail(
        id: json['id'] as String,
        userId: json['userId'] as String,
        status: json['status'] as String,
        totalCents: json['totalCents'] as int,
        shippingCents: json['shippingCents'] as int,
        fullName: json['fullName'] as String,
        street: json['street'] as String,
        city: json['city'] as String,
        postalCode: json['postalCode'] as String,
        country: json['country'] as String,
        createdAt: DateTime.parse(json['createdAt'] as String),
        items: (json['items'] as List<dynamic>)
            .map((e) => OrderItemModel.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}
