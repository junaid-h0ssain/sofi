/**
 * PRODUCT DETAIL PAGE (/products/[slug]) — server side.
 *
 * `[slug]` is a dynamic route segment: whatever sits there in the URL arrives
 * as `params.slug`. Unknown slug → error(404), which SvelteKit renders with
 * its built-in error page.
 */
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getProductBySlug, getRelatedProducts } from '$lib/server/catalog';
import { addToCart } from '$lib/server/cart';

export const load: PageServerLoad = async ({ params }) => {
	const product = await getProductBySlug(params.slug);
	if (!product) error(404, 'Product not found');

	const related = await getRelatedProducts(product.categoryId, product.id, 4);
	return { product, related };
};

export const actions: Actions = {
	/** "Add to cart" button on the detail page. */
	addToCart: async (event) => {
		// Adding to a cart obviously requires being logged in.
		const user = event.locals.user;
		if (!user) redirect(302, '/login');

		const formData = await event.request.formData();
		const productId = String(formData.get('productId') ?? '');
		const quantity = Number.parseInt(String(formData.get('quantity') ?? '1'), 10);

		if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
			return fail(400, { message: 'Invalid request' });
		}

		try {
			await addToCart(user.id, productId, quantity);
		} catch {
			return fail(400, { message: 'Could not add to cart' });
		}

		// Returning success (not a redirect!) keeps the shopper on the page —
		// the client shows a toast and the header cart badge refreshes.
		return { success: true as const };
	}
};
