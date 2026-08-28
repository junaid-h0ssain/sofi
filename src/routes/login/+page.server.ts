/**
 * ============================================================================
 * LOGIN PAGE — server side (now a BFF: talks to the AUTH SERVICE over HTTP)
 * ============================================================================
 *
 * The form action forwards credentials to better-auth running in auth/.
 * On success, better-auth replies with Set-Cookie headers; applySetCookies()
 * copies them onto OUR response so the browser ends up logged in on this
 * origin (from where every later request is proxied/forwarded).
 */
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { authFetch, applySetCookies } from '$lib/server/auth-proxy';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) redirect(302, '/');
	// Only show the GitHub button if OAuth credentials are configured.
	return { hasGithub: Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) };
};

export const actions: Actions = {
	/** Email + password login — proxied to POST /api/auth/sign-in/email. */
	signin: async (event) => {
		const formData = await event.request.formData();
		const email = String(formData.get('email') ?? '').trim();
		const password = String(formData.get('password') ?? '');

		if (!email || !password)
			return fail(400, { message: 'Email and password are required', email });

		const res = await authFetch('/api/auth/sign-in/email', {
			method: 'POST',
			body: JSON.stringify({ email, password })
		});

		if (!res.ok) {
			// Deliberately vague message: never reveal which part was wrong.
			return fail(400, { message: 'Invalid email or password', email });
		}

		// Transfer the session cookies (set by auth svc) into the browser.
		applySetCookies(event.cookies, res.headers.getSetCookie());

		redirect(302, '/');
	},

	/** Start GitHub OAuth — returns { url } pointing at github.com. */
	github: async () => {
		const res = await authFetch('/api/auth/sign-in/social', {
			method: 'POST',
			body: JSON.stringify({ provider: 'github', callbackURL: '/' })
		});

		if (!res.ok) return fail(400, { message: 'GitHub sign-in failed' });

		const data = await res.json();
		if (data?.url) redirect(302, data.url);

		return fail(400, { message: 'GitHub sign-in failed' });
	}
};
