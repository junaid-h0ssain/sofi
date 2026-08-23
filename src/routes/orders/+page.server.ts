/**
 * ORDERS LIST — order history via the API (ownership enforced server-side).
 */
import type { PageServerLoad } from './$types';
import { requireUser } from '$lib/server/guard';
import { ordersApi } from '$lib/server/api';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event.locals);
	const orders = await ordersApi.list(event.locals.sessionToken!);

	return { orders };
};
