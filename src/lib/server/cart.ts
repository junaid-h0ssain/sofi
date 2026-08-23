/**
 * ============================================================================
 * CART — all cart reads & writes for a logged-in user
 * ============================================================================
 *
 * Carts are stored in the database (cart_item table), so they follow the user
 * across devices. Every function takes the userId explicitly and scopes its
 * queries with it — that is our authorization: a user can never read or
 * modify someone else's cart rows because we always filter by THEIR id.
 */
import { and, count, eq } from 'drizzle-orm';
import { db } from './db';
import { brand, cartItem, product } from './db/schema';

export type CartItemWithProduct = {
	id: string;
	quantity: number;
	/** The joined product row, plus the brand name for display. */
	product: typeof product.$inferSelect & { brandName: string };
};

/**
 * Load a user's whole cart in ONE query.
 * We join product (for price/stock/name) and brand (for the little label).
 */
export async function getCart(userId: string): Promise<CartItemWithProduct[]> {
	const rows = await db
		.select({ id: cartItem.id, quantity: cartItem.quantity, product, brandName: brand.name })
		.from(cartItem)
		.innerJoin(product, eq(cartItem.productId, product.id))
		.innerJoin(brand, eq(product.brandId, brand.id))
		.where(eq(cartItem.userId, userId))
		.orderBy(cartItem.createdAt);

	return rows.map((row) => ({ id: row.id, quantity: row.quantity, product: { ...row.product, brandName: row.brandName } }));
}

/** Subtotal = sum of price × quantity. Pure function, easy to test. */
export function getCartTotal(items: CartItemWithProduct[]): number {
	return items.reduce((sum, item) => sum + item.product.priceCents * item.quantity, 0);
}

/** Total number of items — used for the badge on the header cart icon. */
export async function getCartCount(userId: string): Promise<number> {
	const [{ value }] = await db
		.select({ value: count() })
		.from(cartItem)
		.where(eq(cartItem.userId, userId));
	return value;
}

/**
 * Add a product, or bump the quantity if it's already in the cart.
 * The unique index on (userId, productId) makes "one row per product" a
 * database guarantee, not just a convention.
 */
export async function addToCart(userId: string, productId: string, quantity: number) {
	const existing = await db
		.select()
		.from(cartItem)
		.where(and(eq(cartItem.userId, userId), eq(cartItem.productId, productId)))
		.limit(1);

	if (existing.length) {
		const next = Math.min(existing[0].quantity + quantity, 99); // sanity cap
		await db.update(cartItem).set({ quantity: next }).where(eq(cartItem.id, existing[0].id));
		return;
	}

	await db.insert(cartItem).values({ id: crypto.randomUUID(), userId, productId, quantity });
}

/**
 * Set an exact quantity (from the number input on the cart page).
 * The AND userId clause means users can only update their OWN rows —
 * if the row isn't theirs, nothing matches and we throw.
 */
export async function setCartItemQuantity(userId: string, itemId: string, quantity: number) {
	if (quantity < 1 || quantity > 99) throw new Error('Invalid quantity');
	const result = await db
		.update(cartItem)
		.set({ quantity })
		.where(and(eq(cartItem.id, itemId), eq(cartItem.userId, userId)))
		.returning({ id: cartItem.id }); // returning() tells us whether a row matched

	if (!result.length) throw new Error('Cart item not found');
}

export async function removeCartItem(userId: string, itemId: string) {
	await db.delete(cartItem).where(and(eq(cartItem.id, itemId), eq(cartItem.userId, userId)));
}

/** Called after a successful checkout. */
export async function clearCart(userId: string) {
	await db.delete(cartItem).where(eq(cartItem.userId, userId));
}
