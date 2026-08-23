import { desc, eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { brand, category, product } from '$lib/server/db/schema';

export const load: PageServerLoad = async () => {
	const rows = await db
		.select({
			id: product.id,
			name: product.name,
			priceCents: product.priceCents,
			stock: product.stock,
			featured: product.featured,
			brandName: brand.name,
			categoryName: category.name
		})
		.from(product)
		.innerJoin(brand, eq(product.brandId, brand.id))
		.innerJoin(category, eq(product.categoryId, category.id))
		.orderBy(desc(product.createdAt));

	return { products: rows };
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		if (!id) return fail(400, { message: 'Missing product id' });

		try {
			await db.delete(product).where(eq(product.id, id));
		} catch {
			return fail(400, {
				message: 'Cannot delete: this product is referenced by existing orders.'
			});
		}

		return { deleted: true };
	}
};
