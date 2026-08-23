import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/data/models/cart.dart';
import 'package:mobile/data/models/catalog.dart';
import 'package:mobile/data/models/order.dart';

const productJson = {
  'id': 'p1',
  'name': 'Ultra Book 14',
  'slug': 'ultra-book-14',
  'description': 'A light laptop',
  'priceCents': 109900,
  'stock': 5,
  'imageUrl': '/products/laptop.svg',
  'specs': {'RAM': '16 GB', 'CPU': 'M4'},
  'featured': true,
  'createdAt': '2026-01-15T10:30:00.000Z',
  'brand': {'id': 'b1', 'name': 'Apple', 'slug': 'apple'},
  'category': {'id': 'c1', 'name': 'Laptop', 'slug': 'laptop'},
};

void main() {
  group('Product', () {
    test('parses full API payload', () {
      final product = Product.fromJson(productJson);

      expect(product.id, 'p1');
      expect(product.priceCents, 109900);
      expect(product.specs['RAM'], '16 GB');
      expect(product.featured, isTrue);
      expect(product.brand.slug, 'apple');
      expect(product.category.name, 'Laptop');
      expect(product.inStock, isTrue);
    });

    test('handles null imageUrl and empty specs', () {
      final json = <String, dynamic>{...productJson}
        ..['imageUrl'] = null
        ..['specs'] = <String, String>{}
        ..['stock'] = 0;

      final product = Product.fromJson(json);
      expect(product.imageUrl, isNull);
      expect(product.specs, isEmpty);
      expect(product.inStock, isFalse);
    });
  });

  group('PagedProducts', () {
    test('parses pagination envelope', () {
      final paged = PagedProducts.fromJson({
        'items': [productJson],
        'total': 42,
        'page': 2,
        'pages': 5,
      });

      expect(paged.items, hasLength(1));
      expect(paged.total, 42);
      expect(paged.page, 2);
      expect(paged.pages, 5);
      expect(paged.hasMore, isTrue);
    });

    test('hasMore is false on last page', () {
      final paged = PagedProducts.fromJson({
        'items': [],
        'total': 10,
        'page': 3,
        'pages': 3,
      });

      expect(paged.hasMore, isFalse);
    });
  });

  group('CartItem', () {
    test('parses nested product', () {
      final item = CartItem.fromJson({
        'id': 'ci1',
        'quantity': 2,
        'product': productJson,
      });

      expect(item.quantity, 2);
      expect(item.product.name, 'Ultra Book 14');
    });
  });

  group('OrderDetail', () {
    test('parses items and computes subtotal', () {
      final order = OrderDetail.fromJson({
        'id': 'o1',
        'userId': 'u1',
        'status': 'paid',
        'totalCents': 120000,
        'shippingCents': 1000,
        'fullName': 'Ada Lovelace',
        'street': '1 Main St',
        'city': 'Berlin',
        'postalCode': '10115',
        'country': 'Germany',
        'createdAt': '2026-02-01T08:00:00.000Z',
        'items': [
          {
            'id': 'oi1',
            'productName': 'Ultra Book 14',
            'unitPriceCents': 109900,
            'quantity': 1,
            'imageUrl': '/products/laptop.svg',
          },
          {
            'id': 'oi2',
            'productName': 'Mouse',
            'unitPriceCents': 4500,
            'quantity': 2,
            'imageUrl': null,
          },
        ],
      });

      expect(order.status, 'paid');
      expect(order.subtotalCents, 109900 + 2 * 4500);
      expect(order.items[0].imageUrl, '/products/laptop.svg');
    });
  });
}
