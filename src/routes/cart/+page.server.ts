/**
 * ============================================================================
 * CART PAGE (/cart) — server side
 * ============================================================================
 *
 * `load` requires a login (requireUser redirects to /login otherwise) and
 * returns the cart items plus the subtotal.
 *
 * Three named actions handle every mutation from the page:
 *   ?/setQuantity  – number input "Update" button (0 removes the row)
 *   ?/remove       – per-item remove button
 *   ?/clear        – empty the whole cart
 */
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireUser } from '$lib/server/guard';
import { getCart, getCartTotal, removeCartItem, setCartItemQuantity, clearCart } from '$lib/server/cart';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event.locals);
	const items = await getCart(user.id);

	return { items, totalCents: getCartTotal(items) };
};

export const actions: Actions = {
	setQuantity: async (event) => {
		const user = requireUser(event.locals);
		const formData = await event.request.formData();
		const itemId = String(formData.get('itemId') ?? '');
		const quantity = Number.parseInt(String(formData.get('quantity') ?? ''), 10);

		if (!itemId || !Number.isInteger(quantity)) return fail(400, { message: 'Invalid request' });

		try {
			if (quantity < 1) {
				// Typing 0 means "remove" — friendlier than an error.
				await removeCartItem(user.id, itemId);
			} else {
				// Throws if the row doesn't belong to this user → shown as a toast.
				await setCartItemQuantity(user.id, itemId, quantity);
			}
		} catch (err) {
			return fail(400, { message: err instanceof Error ? err.message : 'Update failed' });
		}

		return { success: true as const };
	},

	remove: async (event) => {
		const user = requireUser(event.locals);
		const formData = await event.request.formData();
		const itemId = String(formData.get('itemId') ?? '');

		if (!itemId) return fail(400, { message: 'Invalid request' });

		await removeCartItem(user.id, itemId);
		return { success: true as const };
	},

	clear: async (event) => {
		const user = requireUser(event.locals);
		await clearCart(user.id);
		return { success: true as const };
	}
};
