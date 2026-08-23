import { resolve } from '$app/paths';

/**
 * Central route helpers so links stay consistent across the app.
 *
 * Why not just write href="/products"? SvelteKit apps can be deployed under
 * a sub-path (e.g. example.com/shop/). The `resolve()` helper prepends that
 * base path automatically, so links keep working anywhere.
 *
 * Usage:
 *   resolve('/products')                     → static route
 *   resolve('/products/[slug]', { slug })    → dynamic route with params
 */
export const Link = {
	home: () => resolve('/'),
	products: () => resolve('/products'),
	product: (slug: string) => resolve('/products/[slug]', { slug }),
	category: (slug: string) => `${resolve('/products')}?category=${encodeURIComponent(slug)}`,
	search: (q: string) => `${resolve('/products')}?q=${encodeURIComponent(q)}`,
	cart: () => resolve('/cart'),
	checkout: () => resolve('/checkout'),
	orders: () => resolve('/orders'),
	order: (id: string) => resolve('/orders/[id]', { id }),
	login: () => resolve('/login'),
	signup: () => resolve('/signup'),
	signout: () => resolve('/signout'),
	admin: {
		root: () => resolve('/admin'),
		products: () => resolve('/admin/products'),
		newProduct: () => resolve('/admin/products/new'),
		editProduct: (id: string) => resolve('/admin/products/[id]', { id }),
		brands: () => resolve('/admin/brands'),
		categories: () => resolve('/admin/categories')
	}
};
