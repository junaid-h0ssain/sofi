/**
 * ============================================================================
 * CART PAGE (/cart) — server side (BFF)
 * ============================================================================
 * Same actions as before, but each mutation is an HTTP call to the .NET API
 * carrying the shopper's session token.
 */
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireUser } from '$lib/server/guard';
import { ApiClientError, cartApi } from '$lib/server/api';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event.locals);
	const items = await cartApi.get(event.locals.sessionToken!);

	// Subtotal computed from the API's item payloads (same shape as before).
	const totalCents = items.reduce((sum, i) => sum + i.product.priceCents * i.quantity, 0);

	return { items, totalCents };
};

export const actions: Actions = {
	setQuantity: async (event) => {
		const user = requireUser(event.locals);
		const token = event.locals.sessionToken!;

		const formData = await event.request.formData();
		const itemId = String(formData.get('itemId') ?? '');
		const quantity = Number.parseInt(String(formData.get('quantity') ?? ''), 10);

		if (!itemId || !Number.isInteger(quantity))
			return fail(400, { message: 'Invalid request' });

		try {
			if (quantity < 1) {
				await cartApi.removeItem(token, itemId); // typing 0 = remove
			} else {
				await cartApi.setQuantity(token, itemId, quantity);
			}
		} catch (err) {
			const message =
				err instanceof ApiClientError ? err.message : 'Update failed';
			return fail(400, { message });
		}

		return { success: true as const };
	},

	remove: async (event) => {
		const user = requireUser(event.locals);
		const token = event.locals.sessionToken!;

		const formData = await event.request.formData();
		const itemId = String(formData.get('itemId') ?? '');

		if (!itemId) return fail(400, { message: 'Invalid request' });

		await cartApi.removeItem(token, itemId);
		return { success: true as const };
	},

	clear: async (event) => {
		const user = requireUser(event.locals);
		await cartApi.clear(event.locals.sessionToken!);
		return { success: true as const };
	}
};
