/**
 * ADMIN PRODUCTS LIST — table data + delete action, proxied to the API.
 */
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAdmin } from '$lib/server/guard';
import { ApiClientError, adminApi } from '$lib/server/api';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event.locals);
	const products = await adminApi.products.list(event.locals.sessionToken!);

	return { products };
};

export const actions: Actions = {
	delete: async (event) => {
		const user = requireAdmin(event.locals);
		const token = event.locals.sessionToken!;

		const formData = await event.request.formData();
		const id = String(formData.get('id') ?? '');
		if (!id) return fail(400, { message: 'Missing product id' });

		try {
			await adminApi.products.delete(token, id);
		} catch (err) {
			// FK RESTRICT on the API side → 409 with an explanatory message.
			const message =
				err instanceof ApiClientError ? err.message : 'Delete failed';
			return fail(400, { message });
		}

		return { deleted: true };
	}
};
