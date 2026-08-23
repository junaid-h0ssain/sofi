/**
 * NEW PRODUCT — supplies the form's dropdown options and forwards creation
 * to the .NET API. Parsing/validation stays in $lib/server/product-form.ts.
 */
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAdmin } from '$lib/server/guard';
import { ApiClientError, adminApi, catalogApi } from '$lib/server/api';
import { parseProductForm } from '$lib/server/product-form';

export const load: PageServerLoad = async (event) => {
	requireAdmin(event.locals);
	// Brands/categories are public catalog data; only ONE source for both
	// the storefront filter sidebar and this form.
	const [brands, categories] = await Promise.all([
		catalogApi.brands(),
		catalogApi.categories()
	]);
	return { brands, categories };
};

export const actions: Actions = {
	create: async (event) => {
		const user = requireAdmin(event.locals);
		const token = event.locals.sessionToken!;

		const formData = await event.request.formData();
		const parsed = parseProductForm(formData);
		if (!parsed.ok) return fail(400, { message: parsed.message });

		const { slug, ...request } = parsed.data; // slug is derived by the API

		try {
			await adminApi.products.create(token, request);
		} catch (err) {
			const message =
				err instanceof ApiClientError ? err.message : 'Could not create product';
			return fail(400, { message });
		}

		redirect(302, '/admin/products');
	}
};
