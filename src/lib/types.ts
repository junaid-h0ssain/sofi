/**
 * ============================================================================
 * SHARED TYPES — shapes used by BOTH server and browser code
 * ============================================================================
 *
 * Files under src/lib/server/ may only run on the server (SvelteKit blocks
 * them from leaking into the client bundle). But our UI components need to
 * know what a "product" looks like for type checking, so we define those
 * plain TypeScript interfaces here where everyone can import them safely.
 */

/** A row from the `brand` table. */
export interface Brand {
	id: string;
	name: string;
	slug: string;
}

/** A row from the `category` table. */
export interface Category {
	id: string;
	name: string;
	slug: string;
}

/** A row from the `product` table (mirrors schema.ts). */
export interface Product {
	id: string;
	name: string;
	slug: string;
	description: string;
	/** Price in whole cents — never floats! $19.99 is stored as 1999. */
	priceCents: number;
	stock: number;
	imageUrl: string | null;
	specs: Record<string, string>;
	featured: number; // 1 = shown on homepage
	brandId: string;
	categoryId: string;
	createdAt: Date;
}

/** A product with its brand & category joined in — what catalog queries return. */
export interface ProductWithRelations extends Product {
	brand: Brand;
	category: Category;
}

/** A category plus how many products it contains (for the filter sidebar). */
export interface CategoryWithCount extends Category {
	productCount: number;
}

/**
 * Sorting choices offered on the catalog page. `as const` makes the values
 * literal types ('newest' | 'price-asc' | …) instead of plain string.
 */
export const SORT_OPTIONS = [
	{ value: 'newest', label: 'Newest' },
	{ value: 'price-asc', label: 'Price: Low to High' },
	{ value: 'price-desc', label: 'Price: High to Low' },
	{ value: 'name', label: 'Name A–Z' }
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]['value'];
