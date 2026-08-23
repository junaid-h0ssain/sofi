import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { requireUser } from '$lib/server/guard';
import { db } from '$lib/server/db';
import { order } from '$lib/server/db/schema';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event.locals);

	const orders = await db
		.select()
		.from(order)
		.where(eq(order.userId, user.id))
		.orderBy(desc(order.createdAt));

	return { orders };
};
