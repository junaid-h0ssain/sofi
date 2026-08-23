import type { LayoutServerLoad } from './$types';
import { requireAdmin } from '$lib/server/guard';

export const load: LayoutServerLoad = async (event) => {
	const user = requireAdmin(event.locals);
	return { adminUser: { id: user.id, name: user.name } };
};
