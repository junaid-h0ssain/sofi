import type { PageServerLoad } from './$types';
import { getFeaturedProducts } from '$lib/server/catalog';

export const load: PageServerLoad = async () => {
	const featured = await getFeaturedProducts(8);
	return { featured };
};
