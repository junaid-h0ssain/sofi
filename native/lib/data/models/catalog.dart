class Brand {
  const Brand({required this.id, required this.name, required this.slug});

  final String id;
  final String name;
  final String slug;

  factory Brand.fromJson(Map<String, dynamic> json) => Brand(
        id: json['id'] as String,
        name: json['name'] as String,
        slug: json['slug'] as String,
      );
}

class Category {
  const Category({required this.id, required this.name, required this.slug});

  final String id;
  final String name;
  final String slug;

  factory Category.fromJson(Map<String, dynamic> json) => Category(
        id: json['id'] as String,
        name: json['name'] as String,
        slug: json['slug'] as String,
      );
}

class Product {
  const Product({
    required this.id,
    required this.name,
    required this.slug,
    required this.description,
    required this.priceCents,
    required this.stock,
    required this.imageUrl,
    required this.specs,
    required this.featured,
    required this.createdAt,
    required this.brand,
    required this.category,
  });

  final String id;
  final String name;
  final String slug;
  final String description;
  final int priceCents;
  final int stock;
  final String? imageUrl;
  final Map<String, String> specs;
  final bool featured;
  final DateTime createdAt;
  final Brand brand;
  final Category category;

  bool get inStock => stock > 0;

  factory Product.fromJson(Map<String, dynamic> json) => Product(
        id: json['id'] as String,
        name: json['name'] as String,
        slug: json['slug'] as String,
        description: json['description'] as String? ?? '',
        priceCents: json['priceCents'] as int,
        stock: json['stock'] as int,
        imageUrl: json['imageUrl'] as String?,
        specs: (json['specs'] as Map<String, dynamic>? ?? {})
            .map((k, v) => MapEntry(k, v as String)),
        featured: json['featured'] as bool? ?? false,
        createdAt: DateTime.parse(json['createdAt'] as String),
        brand: Brand.fromJson(json['brand'] as Map<String, dynamic>),
        category: Category.fromJson(json['category'] as Map<String, dynamic>),
      );
}

class PagedProducts {
  const PagedProducts({
    required this.items,
    required this.total,
    required this.page,
    required this.pages,
  });

  final List<Product> items;
  final int total;
  final int page;
  final int pages;

  bool get hasMore => page < pages;

  factory PagedProducts.fromJson(Map<String, dynamic> json) => PagedProducts(
        items: (json['items'] as List<dynamic>)
            .map((e) => Product.fromJson(e as Map<String, dynamic>))
            .toList(),
        total: json['total'] as int,
        page: json['page'] as int,
        pages: json['pages'] as int,
      );
}
