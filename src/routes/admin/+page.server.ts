/**
 * ADMIN DASHBOARD — aggregate numbers via the API's /admin/stats endpoint.
 */
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { requireAdmin } from '$lib/server/guard';
import { ApiClientError, adminApi } from '$lib/server/api';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event.locals);

	try {
		const stats = await adminApi.stats(event.locals.sessionToken!);
		return stats;
	} catch (err) {
		if (err instanceof ApiClientError && err.status === 403) error(403, 'Forbidden');
		throw err;
	}
};
