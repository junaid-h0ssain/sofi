/**
 * HOMEPAGE data loader — featured products now come from the .NET API.
 * Categories already arrive via the root layout.
 */
import type { PageServerLoad } from './$types';
import { catalogApi } from '$lib/server/api';

export const load: PageServerLoad = async () => {
	const featured = await catalogApi.featured(8);
	return { featured };
};
