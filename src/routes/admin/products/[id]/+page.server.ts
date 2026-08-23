/**
 * EDIT PRODUCT — loads the full product from the API, forwards updates.
 */
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAdmin } from '$lib/server/guard';
import { ApiClientError, adminApi, catalogApi } from '$lib/server/api';
import { parseProductForm } from '$lib/server/product-form';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event.locals);
	const token = event.locals.sessionToken!;

	let product;
	try {
		product = await adminApi.products.get(token, event.params.id);
	} catch (err) {
		if (err instanceof ApiClientError && err.status === 404) error(404, 'Product not found');
		throw err;
	}

	// Brands/categories are public catalog data — same source as the storefront.
	const [brands, categories] = await Promise.all([
		catalogApi.brands(),
		catalogApi.categories()
	]);

	return { product, brands, categories };
};

export const actions: Actions = {
	update: async (event) => {
		const user = requireAdmin(event.locals);
		const token = event.locals.sessionToken!;

		const formData = await event.request.formData();
		const parsed = parseProductForm(formData);
		if (!parsed.ok) return fail(400, { message: parsed.message });

		const { slug, ...request } = parsed.data; // slug is derived by the API

		try {
			await adminApi.products.update(token, event.params.id, request);
		} catch (err) {
			const message =
				err instanceof ApiClientError ? err.message : 'Could not update product';
			return fail(400, { message });
		}

		redirect(302, '/admin/products');
	}
};
