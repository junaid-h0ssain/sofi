/**
 * Client-safe shared catalog types & constants (no server-only imports).
 */

export interface Brand {
	id: string;
	name: string;
	slug: string;
}

export interface Category {
	id: string;
	name: string;
	slug: string;
}

export interface Product {
	id: string;
	name: string;
	slug: string;
	description: string;
	priceCents: number;
	stock: number;
	imageUrl: string | null;
	specs: Record<string, string>;
	featured: number;
	brandId: string;
	categoryId: string;
	createdAt: Date;
}

export interface ProductWithRelations extends Product {
	brand: Brand;
	category: Category;
}

export interface CategoryWithCount extends Category {
	productCount: number;
}

export const SORT_OPTIONS = [
	{ value: 'newest', label: 'Newest' },
	{ value: 'price-asc', label: 'Price: Low to High' },
	{ value: 'price-desc', label: 'Price: High to Low' },
	{ value: 'name', label: 'Name A–Z' }
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]['value'];
