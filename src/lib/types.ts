/**
 * ============================================================================
 * SHARED TYPES — mirrors of the .NET API's JSON contracts (Contracts/*.cs)
 * ============================================================================
 *
 * The web app no longer owns business logic: it consumes SoFi.Api over HTTP.
 * These interfaces describe what comes back over the wire so TypeScript can
 * type-check every call site.
 *
 * NOTE: `DateTime` values arrive as ISO strings in JSON.
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

export interface CategoryWithCount extends Category {
	productCount: number;
}

export interface BrandWithCount extends Brand {
	productCount: number;
}

/** A row from the API's product table. Prices are whole CENTS. */
export interface Product {
	id: string;
	name: string;
	slug: string;
	description: string;
	priceCents: number;
	stock: number;
	imageUrl: string | null;
	specs: Record<string, string>;
	featured: boolean; // API exposes bool (DB keeps 0/1)
	brandId: string;
	categoryId: string;
	createdAt: string; // ISO date string
}

export interface ProductWithRelations extends Product {
	brand: Brand;
	category: Category;
}

/** Pagination envelope returned by GET /api/v1/products. */
export interface PagedProducts {
	items: ProductWithRelations[];
	total: number;
	page: number;
	pages: number;
}

export interface CartItem {
	id: string;
	quantity: number;
	product: ProductWithRelations;
}

export interface OrderItemDto {
	id: string;
	productName: string;
	unitPriceCents: number;
	quantity: number;
	imageUrl: string | null;
}

export interface OrderSummary {
	id: string;
	status: 'paid' | 'shipped' | 'delivered' | 'cancelled';
	totalCents: number;
	shippingCents: number;
	city: string;
	country: string;
	createdAt: string;
}

export interface OrderDetail extends Omit<OrderSummary, 'city' | 'country'> {
	userId: string;
	fullName: string;
	street: string;
	city: string;
	postalCode: string;
	country: string;
	items: OrderItemDto[];
}

/**
 * Sorting choices offered on the catalog page.
 */
export const SORT_OPTIONS = [
	{ value: 'newest', label: 'Newest' },
	{ value: 'price-asc', label: 'Price: Low to High' },
	{ value: 'price-desc', label: 'Price: High to Low' },
	{ value: 'name', label: 'Name A–Z' }
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]['value'];
