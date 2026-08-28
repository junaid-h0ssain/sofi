import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/core/config.dart';
import 'package:mobile/data/models/catalog.dart';
import 'package:mobile/ui/core/product_card.dart';

const AppConfig testConfig = AppConfig(
  apiBaseUrl: 'http://api.test',
  authBaseUrl: 'http://auth.test',
  assetBaseUrl: 'http://web.test',
);

Product get fakeProduct => Product.fromJson({
      'id': 'p1',
      'name': 'Ultra Book 14',
      'slug': 'ultra-book-14',
      'description': 'A light laptop',
      'priceCents': 109900,
      'stock': 5,
      'imageUrl': null,
      'specs': <String, dynamic>{},
      'featured': true,
      'createdAt': '2026-01-15T10:30:00.000Z',
      'brand': {'id': 'b1', 'name': 'Apple', 'slug': 'apple'},
      'category': {'id': 'c1', 'name': 'Laptop', 'slug': 'laptop'},
    });

void main() {
  testWidgets('ProductCard lays out inside a bounded grid tile',
      (tester) async {
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: GridView.builder(
          gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
              maxCrossAxisExtent: 260,
              mainAxisExtent: 300,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12),
          itemCount: 1,
          itemBuilder: (_, _) => ProductCard(
            config: testConfig,
            product: fakeProduct,
            onTap: () {},
          ),
        ),
      ),
    ));
    await tester.pump();

    expect(find.text('\$1,099.00'), findsOneWidget);
    expect(find.text('Ultra Book 14'), findsOneWidget);
  });

  testWidgets('ProductCard lays out inside a height-bounded horizontal list',
      (tester) async {
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: SizedBox(
          height: 280,
          child: ListView(scrollDirection: Axis.horizontal, children: [
            SizedBox(
              width: 200,
              child: ProductCard(
                config: testConfig,
                product: fakeProduct,
                imageHeight: 110,
                onTap: () {},
              ),
            ),
          ]),
        ),
      ),
    ));
    await tester.pump();

    expect(tester.takeException(), isNull);
    expect(find.text('Ultra Book 14'), findsOneWidget);
  });
}
