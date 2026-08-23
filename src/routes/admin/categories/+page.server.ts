/**
 * ADMIN CATEGORIES — same CRUD pattern as brands (see that file for details).
 * Category slugs also drive which placeholder image is shown.
 */
import { asc, count, eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { category, product } from '$lib/server/db/schema';
import { slugify } from '$lib/utils/slug';

export const load: PageServerLoad = async () => {
	const categories = await db
		.select({ id: category.id, name: category.name, slug: category.slug, productCount: count(product.id) })
		.from(category)
		.leftJoin(product, eq(product.categoryId, category.id))
		.groupBy(category.id)
		.orderBy(asc(category.name));

	return { categories };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const name = String(formData.get('name') ?? '').trim();
		if (!name) return fail(400, { message: 'Name is required' });

		const slug = slugify(name);
		if (!slug) return fail(400, { message: 'Name must contain letters or numbers' });

		try {
			await db.insert(category).values({ id: crypto.randomUUID(), name, slug });
		} catch {
			return fail(400, { message: 'A category with this name already exists' });
		}

		return { success: true };
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		if (!id) return fail(400, { message: 'Missing id' });

		try {
			await db.delete(category).where(eq(category.id, id));
		} catch {
			return fail(400, { message: 'Cannot delete a category that still has products' });
		}

		return { success: true };
	}
};
