/**
 * ============================================================================
 * ROOT LAYOUT — data that EVERY page needs (now fetched from the .NET API)
 * ============================================================================
 *
 * Same contract as before, but the queries became HTTP calls to SoFi.Api:
 *   - categories for the header nav
 *   - cart item count for the badge
 * The user comes from hooks.server.ts (validated against the auth service).
 */
import type { LayoutServerLoad } from './$types';
import { catalogApi, cartApi } from '$lib/server/api';

export const load: LayoutServerLoad = async (event) => {
	const { user, sessionToken } = event.locals;

	// Promise.all fires both API calls at once instead of sequentially.
	// Anonymous users get a cart count of 0 without calling the API.
	const [categories, cartCount] = await Promise.all([
		catalogApi.categories(),
		user && sessionToken ? cartApi.get(sessionToken).then((items) => items.length) : Promise.resolve(0)
	]);

	return { user, categories, cartCount };
};
