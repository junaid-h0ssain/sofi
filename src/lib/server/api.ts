/**
 * ============================================================================
 * API CLIENT — typed server-side wrapper around the .NET backend
 * ============================================================================
 *
 * Every +page.server.ts calls THESE instead of touching the database.
 * Two responsibilities:
 *   1. Attach the caller's session token as `Authorization: Bearer <token>`
 *      so [Authorize] endpoints know who is asking.
 *   2. Translate non-2xx responses into `ApiClientError`, which page code
 *      catches and converts into SvelteKit fail()/error() results.
 *
 * This file runs ONLY on the server (imported exclusively from
 * +page.server.ts / +layout.server.ts files).
 */
import { API_URL } from './config';
import type {
	Brand,
	CartItem,
	CategoryWithCount,
	OrderDetail,
	OrderSummary,
	PagedProducts,
	ProductWithRelations,
	BrandWithCount
} from '$lib/types';

/** Error carrying an HTTP status + server-provided message. */
export class ApiClientError extends Error {
	constructor(
		public status: number,
		message: string
	) {
		super(message);
	}
}

interface RequestOptions {
	token?: string;
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
	body?: unknown;
}

async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
	const headers: Record<string, string> = {};
	if (options.token) headers.Authorization = `Bearer ${options.token}`;
	if (options.body !== undefined) headers['Content-Type'] = 'application/json';

	const res = await fetch(`${API_URL}${path}`, {
		method: options.method ?? 'GET',
		headers,
		body: options.body !== undefined ? JSON.stringify(options.body) : undefined
	});

	if (!res.ok) {
		let message = `Request failed (${res.status})`;
		try {
			const data = await res.json();
			if (data?.message) message = data.message;
		} catch {
			// non-JSON error body — keep default message
		}
		throw new ApiClientError(res.status, message);
	}

	if (res.status === 204) return undefined as T; // NoContent responses
	return (await res.json()) as T;
}

// ============================================================================
// CATALOG (public — no token needed)
// ============================================================================

export interface CatalogParams {
	q?: string;
	brands?: string[];
	categories?: string[];
	sort?: string;
	min?: number; // dollars
	max?: number; // dollars
	page?: number;
}

export const catalogApi = {
	list(params: CatalogParams): Promise<PagedProducts> {
		const search = new URLSearchParams();
		if (params.q) search.set('q', params.q);
		for (const brand of params.brands ?? []) search.append('brand', brand);
		for (const category of params.categories ?? []) search.append('category', category);
		if (params.sort && params.sort !== 'newest') search.set('sort', params.sort);
		if (params.min !== undefined) search.set('min', String(params.min));
		if (params.max !== undefined) search.set('max', String(params.max));
		if (params.page && params.page > 1) search.set('page', String(params.page));

		const qs = search.toString();
		return api(`/api/v1/products${qs ? `?${qs}` : ''}`);
	},

	featured(limit = 8): Promise<ProductWithRelations[]> {
		return api(`/api/v1/products/featured?limit=${limit}`);
	},

	bySlug(slug: string): Promise<ProductWithRelations | null> {
		return api(`/api/v1/products/${encodeURIComponent(slug)}`);
	},

	related(slug: string, limit = 4): Promise<ProductWithRelations[]> {
		return api(`/api/v1/products/${encodeURIComponent(slug)}/related?limit=${limit}`);
	},

	brands(): Promise<Brand[]> {
		return api('/api/v1/brands');
	},

	categories(): Promise<CategoryWithCount[]> {
		return api('/api/v1/categories');
	}
};

// ============================================================================
// CART & CHECKOUT & ORDERS (require session token)
// ============================================================================

export const cartApi = {
	get(token: string): Promise<CartItem[]> {
		return api('/api/v1/cart', { token });
	},
	addItem(token: string, productId: string, quantity: number): Promise<void> {
		return api('/api/v1/cart/items', { token, method: 'POST', body: { productId, quantity } });
	},
	setQuantity(token: string, itemId: string, quantity: number): Promise<void> {
		return api(`/api/v1/cart/items/${itemId}`, { token, method: 'PUT', body: { quantity } });
	},
	removeItem(token: string, itemId: string): Promise<void> {
		return api(`/api/v1/cart/items/${itemId}`, { token, method: 'DELETE' });
	},
	clear(token: string): Promise<void> {
		return api('/api/v1/cart', { token, method: 'DELETE' });
	}
};

export const checkoutApi = {
	placeOrder(
		token: string,
		request: { fullName: string; street: string; city: string; postalCode: string; country: string }
	): Promise<{ orderId: string }> {
		return api('/api/v1/checkout/orders', { token, method: 'POST', body: request });
	}
};

export const ordersApi = {
	list(token: string): Promise<OrderSummary[]> {
		return api('/api/v1/orders', { token });
	},
	get(token: string, id: string): Promise<OrderDetail> {
		return api(`/api/v1/orders/${id}`, { token });
	}
};

// ============================================================================
// ADMIN (require an admin session token)
// ============================================================================

export interface AdminProductRow {
	id: string;
	name: string;
	priceCents: number;
	stock: number;
	featured: boolean;
	brandName: string;
	categoryName: string;
}

export type AdminProductDetail = ProductWithRelations;

export interface SaveProductRequest {
	name: string;
	description: string;
	price: number; // dollars
	stock: number;
	brandId: string;
	categoryId: string;
	imageUrl?: string | null;
	featured: boolean;
	specs: Record<string, string>;
}

export interface AdminStats {
	productCount: number;
	orderCount: number;
	revenueCents: number;
}

export const adminApi = {
	stats(token: string): Promise<AdminStats> {
		return api('/api/v1/admin/products/stats', { token });
	},
	products: {
		list(token: string): Promise<AdminProductRow[]> {
			return api('/api/v1/admin/products', { token });
		},
		get(token: string, id: string): Promise<AdminProductDetail> {
			return api(`/api/v1/admin/products/${id}`, { token });
		},
		create(token: string, request: SaveProductRequest): Promise<{ id: string }> {
			return api('/api/v1/admin/products', { token, method: 'POST', body: request });
		},
		update(token: string, id: string, request: SaveProductRequest): Promise<void> {
			return api(`/api/v1/admin/products/${id}`, { token, method: 'PUT', body: request });
		},
		delete(token: string, id: string): Promise<void> {
			return api(`/api/v1/admin/products/${id}`, { token, method: 'DELETE' });
		}
	},
	brands: {
		list(token: string): Promise<BrandWithCount[]> {
			return api('/api/v1/admin/brands', { token });
		},
		create(token: string, name: string): Promise<void> {
			return api('/api/v1/admin/brands', { token, method: 'POST', body: { name } });
		},
		delete(token: string, id: string): Promise<void> {
			return api(`/api/v1/admin/brands/${id}`, { token, method: 'DELETE' });
		}
	},
	categories: {
		list(token: string): Promise<CategoryWithCount[]> {
			return api('/api/v1/admin/categories', { token });
		},
		create(token: string, name: string): Promise<void> {
			return api('/api/v1/admin/categories', { token, method: 'POST', body: { name } });
		},
		delete(token: string, id: string): Promise<void> {
			return api(`/api/v1/admin/categories/${id}`, { token, method: 'DELETE' });
		}
	}
};
