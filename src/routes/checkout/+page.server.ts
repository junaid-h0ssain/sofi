import { eq, sql } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireUser } from '$lib/server/guard';
import { getCart, getCartTotal } from '$lib/server/cart';
import { calcShippingCents } from '$lib/utils/pricing';
import { db } from '$lib/server/db';
import { cartItem, order, orderItem, product } from '$lib/server/db/schema';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event.locals);
	const items = await getCart(user.id);

	if (items.length === 0) redirect(302, '/cart');

	return {
		items,
		subtotalCents: getCartTotal(items),
		defaultName: user.name
	};
};

export const actions: Actions = {
	placeOrder: async (event) => {
		const user = requireUser(event.locals);

		const formData = await event.request.formData();
		const fullName = String(formData.get('fullName') ?? '').trim();
		const street = String(formData.get('street') ?? '').trim();
		const city = String(formData.get('city') ?? '').trim();
		const postalCode = String(formData.get('postalCode') ?? '').trim();
		const country = String(formData.get('country') ?? '').trim();

		const fieldErrors: Record<string, string> = {};
		if (!fullName) fieldErrors.fullName = 'Full name is required';
		if (!street) fieldErrors.street = 'Street is required';
		if (!city) fieldErrors.city = 'City is required';
		if (!postalCode) fieldErrors.postalCode = 'Postal code is required';
		if (!country) fieldErrors.country = 'Country is required';
		if (Object.keys(fieldErrors).length > 0) return fail(400, { message: 'Please fill in all fields', fieldErrors });

		const items = await getCart(user.id);
		if (items.length === 0) return fail(400, { message: 'Your cart is empty' });

		for (const item of items) {
			if (item.product.stock < item.quantity) {
				return fail(400, {
					message: `Insufficient stock for ${item.product.name} (${item.product.stock} left)`
				});
			}
		}

		const subtotalCents = getCartTotal(items);
		const shippingCents = calcShippingCents(subtotalCents);
		const totalCents = subtotalCents + shippingCents;
		const orderId = crypto.randomUUID();

		// neon-http has no interactive transactions; db.batch runs all statements atomically instead.
		await db.batch([
			db.insert(order).values({
				id: orderId,
				userId: user.id,
				totalCents,
				shippingCents,
				status: 'paid',
				fullName,
				street,
				city,
				postalCode,
				country
			}),
			...items.map((item) =>
				db.insert(orderItem).values({
					id: crypto.randomUUID(),
					orderId,
					productId: item.product.id,
					productName: item.product.name,
					unitPriceCents: item.product.priceCents,
					quantity: item.quantity
				})
			),
			...items.map((item) =>
				db
					.update(product)
					.set({ stock: sql`${product.stock} - ${item.quantity}` })
					.where(eq(product.id, item.product.id))
			),
			db.delete(cartItem).where(eq(cartItem.userId, user.id))
		]);

		redirect(302, `/orders/${orderId}`);
	}
};
