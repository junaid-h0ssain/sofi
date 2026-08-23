/**
 * ============================================================================
 * ROOT LAYOUT — data that EVERY page needs
 * ============================================================================
 *
 * A `+layout.server.ts` load runs before every page inside it. We use it to
 * fetch the things the header shows on all pages:
 *   - the signed-in user (set by hooks.server.ts into event.locals)
 *   - category list for the navigation
 *   - cart item count for the little badge on the cart icon
 */
import type { LayoutServerLoad } from './$types';
import { getCategoriesWithCounts } from '$lib/server/catalog';
import { getCartCount } from '$lib/server/cart';

export const load: LayoutServerLoad = async (event) => {
	const user = event.locals.user; // undefined when not logged in

	// Promise.all runs both queries at once instead of one-after-another.
	// Anonymous users get a cart count of 0 without touching the database.
	const [categories, cartCount] = await Promise.all([
		getCategoriesWithCounts(),
		user ? getCartCount(user.id) : Promise.resolve(0)
	]);

	return { user, categories, cartCount };
};
