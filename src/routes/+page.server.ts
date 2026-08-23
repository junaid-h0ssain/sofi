/**
 * HOMEPAGE data loader.
 * The categories already come from the root layout, so here we only fetch
 * the featured products grid.
 */
import type { PageServerLoad } from './$types';
import { getFeaturedProducts } from '$lib/server/catalog';

export const load: PageServerLoad = async () => {
	const featured = await getFeaturedProducts(8);
	return { featured };
};
