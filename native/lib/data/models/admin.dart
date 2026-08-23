class AdminStats {
  const AdminStats({
    required this.productCount,
    required this.orderCount,
    required this.revenueCents,
  });

  final int productCount;
  final int orderCount;
  final int revenueCents;

  factory AdminStats.fromJson(Map<String, dynamic> json) => AdminStats(
        productCount: json['productCount'] as int,
        orderCount: json['orderCount'] as int,
        revenueCents: json['revenueCents'] as int,
      );
}

class AdminProductRow {
  const AdminProductRow({
    required this.id,
    required this.name,
    required this.priceCents,
    required this.stock,
    required this.featured,
    required this.brandName,
    required this.categoryName,
  });

  final String id;
  final String name;
  final int priceCents;
  final int stock;
  final bool featured;
  final String brandName;
  final String categoryName;

  factory AdminProductRow.fromJson(Map<String, dynamic> json) =>
      AdminProductRow(
        id: json['id'] as String,
        name: json['name'] as String,
        priceCents: json['priceCents'] as int,
        stock: json['stock'] as int,
        featured: json['featured'] as bool,
        brandName: json['brandName'] as String,
        categoryName: json['categoryName'] as String,
      );
}

class TaxonomyWithCount {
  const TaxonomyWithCount({
    required this.id,
    required this.name,
    required this.slug,
    required this.productCount,
  });

  final String id;
  final String name;
  final String slug;
  final int productCount;

  factory TaxonomyWithCount.fromJson(Map<String, dynamic> json) =>
      TaxonomyWithCount(
        id: json['id'] as String,
        name: json['name'] as String,
        slug: json['slug'] as String,
        productCount: json['productCount'] as int,
      );
}
