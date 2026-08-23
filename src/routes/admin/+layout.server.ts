/**
 * ADMIN LAYOUT GUARD — runs before EVERY /admin/* page.
 *
 * Putting the check in the layout (instead of copying it into each admin
 * page) is the DRY way to protect a whole route group. A non-admin never
 * even reaches the child pages.
 */
import type { LayoutServerLoad } from './$types';
import { requireAdmin } from '$lib/server/guard';

export const load: LayoutServerLoad = async (event) => {
	const user = requireAdmin(event.locals);
	return { adminUser: { id: user.id, name: user.name } };
};
