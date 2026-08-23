/**
 * ============================================================================
 * AUTHENTICATION — better-auth configuration
 * ============================================================================
 *
 * better-auth is a library that handles users, sessions, passwords and OAuth
 * for us. This file configures it; the library then serves endpoints under
 * /api/auth (see src/hooks.server.ts where that routing happens).
 */
import { env } from '$env/dynamic/private';
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { admin } from 'better-auth/plugins/admin';
import { db } from '$lib/server/db';

export const auth = betterAuth({
	// The public URL of this app — needed when building links in emails/OAuth.
	baseURL: env.ORIGIN,
	// Secret used to sign session tokens. Keep it in .env, never in git!
	secret: env.BETTER_AUTH_SECRET,
	// Store users & sessions in our Postgres database via Drizzle.
	database: drizzleAdapter(db, { provider: 'pg' }),
	// Classic email + password login. (Social logins are configured below.)
	emailAndPassword: { enabled: true },
	socialProviders: {
		github: {
			clientId: env.GITHUB_CLIENT_ID,
			clientSecret: env.GITHUB_CLIENT_SECRET
		}
	},
	plugins: [
		// Adds user roles (user.role) and admin-only APIs like banning users or
		// listing accounts. We use `role === 'admin'` to guard the /admin area.
		admin(),
		// Makes better-auth set/read its cookies through SvelteKit's request
		// events. Must stay LAST in this array.
		sveltekitCookies(getRequestEvent)
	]
});
