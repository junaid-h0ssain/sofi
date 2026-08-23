/**
 * ============================================================================
 * GUARDS — tiny helpers that protect routes
 * ============================================================================
 *
 * Any +page.server.ts / +layout.server.ts calls one of these first thing.
 * `redirect()` throws a special object that SvelteKit turns into an HTTP
 * redirect — that's why these functions have no return-after-throw code:
 * execution never continues past them when access is denied.
 */
import { redirect } from '@sveltejs/kit';

/**
 * Require any signed-in user.
 * Usage: `const user = requireUser(event.locals);`
 */
export function requireUser(locals: App.Locals) {
	const { user } = locals;
	if (!user) redirect(302, '/login'); // 302 = temporary redirect
	return user;
}

/**
 * Require an admin. Checks the `role` column added by better-auth's admin
 * plugin; non-admins are silently sent back to the homepage.
 */
export function requireAdmin(locals: App.Locals) {
	const user = requireUser(locals);
	if (user.role !== 'admin') redirect(302, '/');
	return user;
}
