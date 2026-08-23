/**
 * ============================================================================
 * CHECKOUT (/checkout) — the most interesting server file in the project
 * ============================================================================
 *
 * THE CHALLENGE: placing an order must change FOUR things at once —
 *   1. insert the `order` row
 *   2. insert one `order_item` row per product
 *   3. decrement each product's stock
 *   4. empty the user's cart
 * If any step failed midway, we'd have orders without items or phantom stock.
 *
 * Normally you'd wrap this in a database transaction. BUT our neon-http
 * driver doesn't support interactive transactions (`db.transaction` throws!).
 * The solution: `db.batch([...])` sends ALL statements in a single HTTP
 * request that Postgres executes atomically — all succeed or none apply.
 *
 * To make batch possible, statements must be built BEFORE any of them runs.
 * That's why order.id is generated in JavaScript (crypto.randomUUID())
 * instead of letting the database auto-generate it: we need the id to build
 * the order_item inserts, but batch can't read results between statements.
 */
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

	// Nothing to check out? Back to the cart page.
	if (items.length === 0) redirect(302, '/cart');

	return {
		items,
		subtotalCents: getCartTotal(items),
		defaultName: user.name // pre-fill the "Full name" field
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

		// --- 1. Validate the address form -----------------------------------
		const fieldErrors: Record<string, string> = {};
		if (!fullName) fieldErrors.fullName = 'Full name is required';
		if (!street) fieldErrors.street = 'Street is required';
		if (!city) fieldErrors.city = 'City is required';
		if (!postalCode) fieldErrors.postalCode = 'Postal code is required';
		if (!country) fieldErrors.country = 'Country is required';
		if (Object.keys(fieldErrors).length > 0)
			return fail(400, { message: 'Please fill in all fields', fieldErrors });

		// --- 2. Re-read the cart on the SERVER -------------------------------
		// Never trust prices from the browser — always recalculate from the DB,
		// otherwise anyone could POST a fake $0 total.
		const items = await getCart(user.id);
		if (items.length === 0) return fail(400, { message: 'Your cart is empty' });

		// --- 3. Make sure every item is still in stock -----------------------
		for (const item of items) {
			if (item.product.stock < item.quantity) {
				return fail(400, {
					message: `Insufficient stock for ${item.product.name} (${item.product.stock} left)`
				});
			}
		}

		// --- 4. Compute totals from server-side data -------------------------
		const subtotalCents = getCartTotal(items);
		const shippingCents = calcShippingCents(subtotalCents);
		const totalCents = subtotalCents + shippingCents;
		const orderId = crypto.randomUUID();

		// --- 5. ONE atomic batch does everything ------------------------------
		await db.batch([
			db.insert(order).values({
				id: orderId,
				userId: user.id,
				totalCents,
				shippingCents,
				status: 'paid', // mock checkout = instant successful payment
				fullName,
				street,
				city,
				postalCode,
				country
			}),
			// Spread one insert statement per cart line…
			...items.map((item) =>
				db.insert(orderItem).values({
					id: crypto.randomUUID(),
					orderId,
					productId: item.product.id,
					productName: item.product.name, // snapshot for history
					unitPriceCents: item.product.priceCents,
					quantity: item.quantity
				})
			),
			// …decrement stock in SQL ("stock = stock - n") instead of JS,
			// so it stays correct even if two checkouts race each other…
			...items.map((item) =>
				db
					.update(product)
					.set({ stock: sql`${product.stock} - ${item.quantity}` })
					.where(eq(product.id, item.product.id))
			),
			// …and finally clear the buyer's cart.
			db.delete(cartItem).where(eq(cartItem.userId, user.id))
		]);

		// --- 6. Send the shopper to their brand-new order page --------------
		redirect(302, `/orders/${orderId}`);
	}
};
