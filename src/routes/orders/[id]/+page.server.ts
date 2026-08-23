import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { requireUser } from '$lib/server/guard';
import { db } from '$lib/server/db';
import { order, orderItem, product } from '$lib/server/db/schema';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event.locals);

	const [placed] = await db
		.select()
		.from(order)
		.where(eq(order.id, event.params.id))
		.limit(1);

	if (!placed) error(404, 'Order not found');
	if (placed.userId !== user.id && user.role !== 'admin') error(403, 'Not your order');

	const items = await db
		.select({
			id: orderItem.id,
			productName: orderItem.productName,
			unitPriceCents: orderItem.unitPriceCents,
			quantity: orderItem.quantity,
			imageUrl: product.imageUrl
		})
		.from(orderItem)
		.innerJoin(product, eq(orderItem.productId, product.id))
		.where(eq(orderItem.orderId, placed.id));

	return { order: placed, items };
};
