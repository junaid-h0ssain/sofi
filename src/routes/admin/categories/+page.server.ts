/**
 * ADMIN CATEGORIES — same CRUD pattern as brands.
 * Category slugs also drive which placeholder image is shown.
 */
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAdmin } from '$lib/server/guard';
import { ApiClientError, adminApi } from '$lib/server/api';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event.locals);
	const categories = await adminApi.categories.list(event.locals.sessionToken!);
	return { categories };
};

export const actions: Actions = {
	create: async (event) => {
		requireAdmin(event.locals);
		const token = event.locals.sessionToken!;

		const formData = await event.request.formData();
		const name = String(formData.get('name') ?? '').trim();
		if (!name) return fail(400, { message: 'Name is required' });

		try {
			await adminApi.categories.create(token, name);
		} catch (err) {
			const message =
				err instanceof ApiClientError ? err.message : 'Could not create category';
			return fail(400, { message });
		}

		return { success: true };
	},

	delete: async (event) => {
		requireAdmin(event.locals);
		const token = event.locals.sessionToken!;

		const formData = await event.request.formData();
		const id = String(formData.get('id') ?? '');
		if (!id) return fail(400, { message: 'Missing id' });

		try {
			await adminApi.categories.delete(token, id);
		} catch (err) {
			const message =
				err instanceof ApiClientError ? err.message : 'Could not delete category';
			return fail(400, { message });
		}

		return { success: true };
	}
};
