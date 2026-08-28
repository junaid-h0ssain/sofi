/**
 * ============================================================================
 * HOOKS — runs on EVERY request (now with the split backend)
 * ============================================================================
 *
 * Two jobs:
 *   1. Resolve the signed-in user by asking the AUTH SERVICE to validate the
 *      browser's better-auth cookie. The result goes into event.locals so all
 *      server code can read `locals.user` and `locals.sessionToken`.
 *   2. /api/auth/* requests never reach this logic — they are handled by the
 *      dedicated proxy route (routes/api/auth/[...path]).
 */
import type { Handle } from '@sveltejs/kit';
import { getSessionFromCookieHeader } from '$lib/server/auth-proxy';

export const handle: Handle = async ({ event, resolve }) => {
	const cookieHeader = event.request.headers.get('cookie') ?? '';

	if (cookieHeader) {
		try {
			const session = await getSessionFromCookieHeader(cookieHeader);
			if (session) {
				event.locals.user = {
					id: session.user.id,
					name: session.user.name,
					email: session.user.email,
					image: session.user.image ?? null,
					emailVerified: Boolean(session.user.emailVerified),
					createdAt: session.user.createdAt ?? new Date().toISOString(),
					updatedAt: session.user.updatedAt ?? new Date().toISOString(),
					role: session.user.role ?? null,
					banned: session.user.banned ?? null
				};
				// Plain (unsigned) session token — forwarded to the .NET API as
				// `Authorization: Bearer <token>` on every server-side call.
				event.locals.sessionToken = session.token;
			}
		} catch {
			// Auth service unreachable → treat as anonymous instead of failing
			// the whole site; public pages still work.
		}
	}

	return resolve(event);
};
