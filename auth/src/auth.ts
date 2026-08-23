/**
 * ============================================================================
 * AUTH SERVICE — better-auth configuration (moved from the SvelteKit app)
 * ============================================================================
 *
 * This is now a STANDALONE HTTP service so that:
 *   - the .NET API and a future mobile app can share the same user accounts
 *   - the SvelteKit web app simply proxies /api/auth/* to this service
 *
 * Everything here used to live in src/lib/server/auth.ts. The only changes:
 *   - env vars come from process.env (Bun auto-loads the root ../.env? No —
 *     Bun loads .env from the CURRENT directory, so we run it with
 *     `--env-file ../.env` or copy vars; see compose/README)
 *   - the sveltekitCookies plugin is GONE: it existed only to bridge cookie
 *     handling inside SvelteKit. As a plain Hono service, better-auth reads/
 *     writes cookies on the incoming request/response itself.
 */
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins/admin';
import { db } from './db';

// The WEB app's public URL. better-auth uses it for OAuth callback URLs and
// origin checks: the browser always talks to auth THROUGH the web origin
// (SvelteKit proxies /api/auth/*), so from better-auth's point of view the
// "base URL" stays http://localhost:5173 even though we listen on :4000.
const webOrigin = process.env.ORIGIN ?? 'http://localhost:5173';

export const auth = betterAuth({
	baseURL: webOrigin,
	secret: process.env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	emailAndPassword: { enabled: true },
	socialProviders: {
		github: {
			clientId: process.env.GITHUB_CLIENT_ID ?? '',
			clientSecret: process.env.GITHUB_CLIENT_SECRET ?? ''
		}
	},
	trustedOrigins: [webOrigin],
	plugins: [
		// Adds the `role` column on users + admin APIs. The .NET API trusts the
		// role value it reads from the shared `user` table.
		admin()
	]
});
