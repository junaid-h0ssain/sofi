/**
 * ORDER DETAIL (/orders/[id]) — with ownership checks in BOTH layers:
 *   - the API returns 403/404 for foreign/unknown ids
 *   - we translate those into SvelteKit error pages
 */
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { requireUser } from '$lib/server/guard';
import { ApiClientError, ordersApi } from '$lib/server/api';

export const load: PageServerLoad = async (event) => {
	const user = requireUser(event.locals);

	let order;
	try {
		order = await ordersApi.get(event.locals.sessionToken!, event.params.id);
	} catch (err) {
		if (err instanceof ApiClientError && err.status === 403) error(403, 'Not your order');
		if (err instanceof ApiClientError && err.status === 404) error(404, 'Order not found');
		throw err;
	}

	return { order };
};
