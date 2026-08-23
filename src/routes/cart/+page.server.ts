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
				await removeCartItem(user.id, itemId);
			} else {
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
