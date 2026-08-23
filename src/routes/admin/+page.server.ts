import { count, eq, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { order, orderItem, product } from '$lib/server/db/schema';

export const load: PageServerLoad = async () => {
	const [[productCount], [orderCount], [revenue]] = await Promise.all([
		db.select({ value: count() }).from(product),
		db.select({ value: count() }).from(order).where(eq(order.status, 'paid')),
		db
			.select({ value: sql<number>`coalesce(sum(${orderItem.unitPriceCents} * ${orderItem.quantity}), 0)::int` })
			.from(orderItem)
	]);

	return { productCount: productCount.value, orderCount: orderCount.value, revenueCents: revenue.value };
}
