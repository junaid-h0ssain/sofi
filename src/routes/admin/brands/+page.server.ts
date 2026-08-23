/**
 * ADMIN BRANDS — read list + create/delete actions.
 * Deleting is only allowed while a brand has zero products (the FK would
 * otherwise reject it; we check the count in the UI and catch SQL errors).
 */
import { asc, count, eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { brand, product } from '$lib/server/db/schema';
import { slugify } from '$lib/utils/slug';

export const load: PageServerLoad = async () => {
	const brands = await db
		.select({ id: brand.id, name: brand.name, slug: brand.slug, productCount: count(product.id) })
		.from(brand)
		.leftJoin(product, eq(product.brandId, brand.id))
		.groupBy(brand.id)
		.orderBy(asc(brand.name));

	return { brands };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const name = String(formData.get('name') ?? '').trim();
		if (!name) return fail(400, { message: 'Name is required' });

		const slug = slugify(name);
		if (!slug) return fail(400, { message: 'Name must contain letters or numbers' });

		try {
			await db.insert(brand).values({ id: crypto.randomUUID(), name, slug });
		} catch {
			// unique index on slug rejected it
			return fail(400, { message: 'A brand with this name already exists' });
		}

		return { success: true };
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		if (!id) return fail(400, { message: 'Missing id' });

		try {
			await db.delete(brand).where(eq(brand.id, id));
		} catch {
			return fail(400, { message: 'Cannot delete a brand that still has products' });
		}

		return { success: true };
	}
};
