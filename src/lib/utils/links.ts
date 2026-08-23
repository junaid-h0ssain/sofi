import { resolve } from '$app/paths';

/**
 * Central route helpers so links stay consistent and respect `paths.base`.
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
