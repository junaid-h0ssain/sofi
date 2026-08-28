/**
 * ============================================================================
 * CHECKOUT (/checkout) — server side (BFF)
 * ============================================================================
 *
 * The heavy lifting (validation of totals, stock, atomic write) now lives in
 * the .NET API's CheckoutService. This action only:
 *   1. checks the user is signed in
 *   2. validates the address form (fast feedback without an API round trip)
 *   3. forwards the request and redirects to the confirmation page
 */
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireUser } from '$lib/server/guard';
import { ApiClientError, cartApi, checkoutApi } from '$lib/server/api';
import { calcShippingCents } from '$lib/utils/pricing';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event.locals);
	const items = await cartApi.get(event.locals.sessionToken!);

	// Nothing to check out? Back to the cart page.
	if (items.length === 0) redirect(302, '/cart');

	const subtotalCents = items.reduce((sum, i) => sum + i.product.priceCents * i.quantity, 0);

	return {
		items,
		subtotalCents,
		defaultName: user.name // pre-fill the "Full name" field
	};
};

export const actions: Actions = {
	placeOrder: async (event) => {
		const user = requireUser(event.locals);
		const token = event.locals.sessionToken!;

		const formData = await event.request.formData();
		const fullName = String(formData.get('fullName') ?? '').trim();
		const street = String(formData.get('street') ?? '').trim();
		const city = String(formData.get('city') ?? '').trim();
		const postalCode = String(formData.get('postalCode') ?? '').trim();
		const country = String(formData.get('country') ?? '').trim();

		if (!fullName || !street || !city || !postalCode || !country)
			return fail(400, { message: 'Please fill in all fields' });

		let orderId: string;
		try {
			// API recalculates totals & verifies stock server-side — the browser
			// is never trusted with prices.
			const result = await checkoutApi.placeOrder(token, {
				fullName,
				street,
				city,
				postalCode,
				country
			});
			orderId = result.orderId;
		} catch (err) {
			const message =
				err instanceof ApiClientError ? err.message : 'Could not place order';
			return fail(400, { message });
		}

		redirect(302, `/orders/${orderId}`);
	}
};
