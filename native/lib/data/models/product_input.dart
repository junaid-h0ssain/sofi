class ProductInput {
  const ProductInput({
    required this.name,
    required this.description,
    required this.price,
    required this.stock,
    required this.brandId,
    required this.categoryId,
    this.imageUrl,
    required this.featured,
    required this.specs,
  });

  final String name;
  final String description;

  /// Dollars; the API converts to cents.
  final num price;
  final int stock;
  final String brandId;
  final String categoryId;
  final String? imageUrl;
  final bool featured;
  final Map<String, String> specs;

  Map<String, Object?> toBody() => {
        'name': name,
        'description': description,
        'price': price,
        'stock': stock,
        'brandId': brandId,
        'categoryId': categoryId,
        'imageUrl': imageUrl,
        'featured': featured,
        'specs': specs,
      };
}
