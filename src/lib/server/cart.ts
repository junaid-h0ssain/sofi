import { and, count, eq } from 'drizzle-orm';
import { db } from './db';
import { brand, cartItem, product } from './db/schema';

export type CartItemWithProduct = {
	id: string;
	quantity: number;
	product: typeof product.$inferSelect & { brandName: string };
};

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

export function getCartTotal(items: CartItemWithProduct[]): number {
	return items.reduce((sum, item) => sum + item.product.priceCents * item.quantity, 0);
}

export async function getCartCount(userId: string): Promise<number> {
	const [{ value }] = await db
		.select({ value: count() })
		.from(cartItem)
		.where(eq(cartItem.userId, userId));
	return value;
}

export async function addToCart(userId: string, productId: string, quantity: number) {
	const existing = await db
		.select()
		.from(cartItem)
		.where(and(eq(cartItem.userId, userId), eq(cartItem.productId, productId)))
		.limit(1);

	if (existing.length) {
		const next = Math.min(existing[0].quantity + quantity, 99);
		await db.update(cartItem).set({ quantity: next }).where(eq(cartItem.id, existing[0].id));
		return;
	}

	await db.insert(cartItem).values({ id: crypto.randomUUID(), userId, productId, quantity });
}

export async function setCartItemQuantity(userId: string, itemId: string, quantity: number) {
	if (quantity < 1 || quantity > 99) throw new Error('Invalid quantity');
	const result = await db
		.update(cartItem)
		.set({ quantity })
		.where(and(eq(cartItem.id, itemId), eq(cartItem.userId, userId)))
		.returning({ id: cartItem.id });

	if (!result.length) throw new Error('Cart item not found');
}

export async function removeCartItem(userId: string, itemId: string) {
	await db.delete(cartItem).where(and(eq(cartItem.id, itemId), eq(cartItem.userId, userId)));
}

export async function clearCart(userId: string) {
	await db.delete(cartItem).where(eq(cartItem.userId, userId));
}
