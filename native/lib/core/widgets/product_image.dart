import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../config.dart';

class ProductImage extends StatelessWidget {
  const ProductImage({
    super.key,
    required this.config,
    required this.categorySlug,
    this.imageUrl,
    this.size = 120,
  });

  final AppConfig config;
  final String categorySlug;
  final String? imageUrl;
  final double size;

  @override
  Widget build(BuildContext context) {
    if (imageUrl == null || imageUrl!.isEmpty) return _fallback(context);

    final resolved = Uri.parse(imageUrl!).isAbsolute
        ? Uri.parse(imageUrl!)
        : config.resolveUri(config.assetBaseUrl, imageUrl!);

    if (resolved.path.endsWith('.svg')) {
      return SvgPicture.network(
        resolved.toString(),
        width: size,
        height: size,
        fit: BoxFit.contain,
        placeholderBuilder: (_) => _placeholder(context),
      );
    }

    return Image.network(
      resolved.toString(),
      width: size,
      height: size,
      fit: BoxFit.contain,
      errorBuilder: (_, _, _) => _fallback(context),
      loadingBuilder: (_, child, progress) =>
          progress == null ? child : _placeholder(context),
    );
  }

  Widget _placeholder(BuildContext context) => SizedBox(
        width: size,
        height: size,
        child: Center(
          child: SizedBox(
            width: size * 0.4,
            height: size * 0.4,
            child: const CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
      );

  Widget _fallback(BuildContext context) {
    return Container(
      width: size,
      height: size,
      color: Theme.of(context).colorScheme.surfaceContainerHighest,
      alignment: Alignment.center,
      child: Icon(
        _categoryIcon(categorySlug),
        size: size * 0.45,
        color: Theme.of(context).colorScheme.outline,
      ),
    );
  }
}

IconData _categoryIcon(String slug) {
  switch (slug) {
    case 'laptop':
    case 'tablet':
      return Icons.laptop_mac;
    case 'phone':
      return Icons.smartphone;
    case 'router':
      return Icons.router;
    case 'headphones':
      return Icons.headphones;
    case 'camera':
      return Icons.camera_alt;
    case 'smartwatch':
      return Icons.watch;
    case 'tv':
      return Icons.tv;
    default:
      return Icons.devices_other;
  }
}
