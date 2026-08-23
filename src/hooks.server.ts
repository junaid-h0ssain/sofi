/**
 * ============================================================================
 * HOOKS — code that runs on EVERY request to the server
 * ============================================================================
 *
 * SvelteKit "hooks" are like middleware in other frameworks. This handle
 * function wraps every incoming request and can inspect/modify it.
 *
 * Two jobs here:
 *   1. Load the current user's session (from their session cookie) and expose
 *      it as `event.locals` — a per-request scratchpad available everywhere
 *      on the server, including load functions and form actions.
 *   2. Let better-auth handle its own endpoints under /api/auth/*.
 */
import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	// Read the session cookie and ask better-auth who this is.
	// `session.user` = row from the user table, `session.session` = token info.
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		// From here on, every server-side file can do:
		//   const user = event.locals.user  // undefined if not signed in
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	// Pass control on: better-auth serves /api/auth routes,
	// everything else continues through the normal SvelteKit pipeline.
	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = handleBetterAuth;
