import { eq } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getBrands, getCategoriesWithCounts } from '$lib/server/catalog';
import { parseProductForm } from '$lib/server/product-form';
import { db } from '$lib/server/db';
import { product } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ params }) => {
	const [existing] = await db.select().from(product).where(eq(product.id, params.id)).limit(1);
	if (!existing) error(404, 'Product not found');

	const [brands, categories] = await Promise.all([getBrands(), getCategoriesWithCounts()]);
	return { product: existing, brands, categories };
};

export const actions: Actions = {
	update: async ({ request, params }) => {
		const formData = await request.formData();
		const parsed = parseProductForm(formData);
		if (!parsed.ok) return fail(400, { message: parsed.message });

		try {
			await db.update(product).set(parsed.data).where(eq(product.id, params.id));
		} catch {
			return fail(400, { message: 'Could not update product (slug may already exist)' });
		}

		redirect(302, '/admin/products');
	}
};
