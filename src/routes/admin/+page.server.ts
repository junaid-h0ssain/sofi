/**
 * ADMIN DASHBOARD — three aggregate numbers for the landing page.
 * count() becomes COUNT(*); the revenue line drops to raw SQL because
 * multiplying two columns inside a sum has no Drizzle helper.
 */
import { count, eq, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { order, orderItem, product } from '$lib/server/db/schema';

export const load: PageServerLoad = async () => {
	// Destructuring `[productCount]` grabs the first (only) row of each query.
	const [[productCount], [orderCount], [revenue]] = await Promise.all([
		db.select({ value: count() }).from(product),
		// Only 'paid' orders count as sales.
		db.select({ value: count() }).from(order).where(eq(order.status, 'paid')),
		db
			.select({ value: sql<number>`coalesce(sum(${orderItem.unitPriceCents} * ${orderItem.quantity}), 0)::int` })
			.from(orderItem)
	]);

	return { productCount: productCount.value, orderCount: orderCount.value, revenueCents: revenue.value };
};
