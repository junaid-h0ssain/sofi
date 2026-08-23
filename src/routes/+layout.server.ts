import type { LayoutServerLoad } from './$types';
import { getCategoriesWithCounts } from '$lib/server/catalog';
import { getCartCount } from '$lib/server/cart';

export const load: LayoutServerLoad = async (event) => {
	const user = event.locals.user;

	// Parallel: header needs categories and cart badge in one round trip.
	const [categories, cartCount] = await Promise.all([
		getCategoriesWithCounts(),
		user ? getCartCount(user.id) : Promise.resolve(0)
	]);

	return { user, categories, cartCount };
};
