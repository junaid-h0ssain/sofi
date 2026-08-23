import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getBrands, getCategoriesWithCounts } from '$lib/server/catalog';
import { parseProductForm } from '$lib/server/product-form';
import { db } from '$lib/server/db';
import { product } from '$lib/server/db/schema';

export const load: PageServerLoad = async () => {
	const [brands, categories] = await Promise.all([getBrands(), getCategoriesWithCounts()]);
	return { brands, categories };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const parsed = parseProductForm(formData);
		if (!parsed.ok) return fail(400, { message: parsed.message });

		try {
			await db.insert(product).values({ id: crypto.randomUUID(), ...parsed.data });
		} catch {
			return fail(400, { message: 'Could not create product (slug may already exist)' });
		}

		redirect(302, '/admin/products');
	}
};
