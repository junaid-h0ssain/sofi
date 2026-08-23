import { redirect } from '@sveltejs/kit';

/**
 * Throws a redirect to /login when there is no session.
 */
export function requireUser(locals: App.Locals) {
	const { user } = locals;
	if (!user) redirect(302, '/login');
	return user;
}

/**
 * Throws a redirect to home when the current user is not an admin.
 */
export function requireAdmin(locals: App.Locals) {
	const user = requireUser(locals);
	if (user.role !== 'admin') redirect(302, '/');
	return user;
}
