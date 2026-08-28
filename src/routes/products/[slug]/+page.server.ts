/**
 * PRODUCT DETAIL PAGE (/products/[slug]) — server side (BFF).
 *
 * The load calls the API; unknown slug → error(404) as before.
 * The add-to-cart action forwards the user's session token so the API's
 * [Authorize] endpoint can identify the shopper.
 */
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { ApiClientError, catalogApi, cartApi } from '$lib/server/api';

export const load: PageServerLoad = async ({ params }) => {
	const product = await catalogApi.bySlug(params.slug);
	if (!product) error(404, 'Product not found');

	const related = await catalogApi.related(params.slug, 4);
	return { product, related };
};

export const actions: Actions = {
	/** "Add to cart" button on the detail page. */
	addToCart: async (event) => {
		const user = event.locals.user;
		if (!user) redirect(302, '/login');

		const token = event.locals.sessionToken!; // present whenever a user is

		const formData = await event.request.formData();
		const productId = String(formData.get('productId') ?? '');
		const quantity = Number.parseInt(String(formData.get('quantity') ?? '1'), 10);

		if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
			return fail(400, { message: 'Invalid request' });
		}

		try {
			await cartApi.addItem(token, productId, quantity);
		} catch (err) {
			const message =
				err instanceof ApiClientError ? err.message : 'Could not add to cart';
			return fail(400, { message });
		}

		// Success keeps the shopper on the page: a toast shows + the layout
		// invalidation refreshes the header cart badge.
		return { success: true as const };
	}
};
