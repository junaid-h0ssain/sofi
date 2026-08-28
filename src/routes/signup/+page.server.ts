/**
 * SIGNUP PAGE — server side (BFF to the auth service).
 * Validates the form manually, then hands values to better-auth which hashes
 * the password and creates the user row.
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
	signup: async (event) => {
		const formData = await event.request.formData();
		const name = String(formData.get('name') ?? '').trim();
		const email = String(formData.get('email') ?? '').trim().toLowerCase();
		const password = String(formData.get('password') ?? '');

		// Server-side validation is mandatory — client-side attributes like
		// `required` can be bypassed by anyone with curl.
		if (!name) return fail(400, { message: 'Name is required', email, name });
		if (!email.includes('@')) return fail(400, { message: 'A valid email is required', email, name });
		if (password.length < 8)
			return fail(400, { message: 'Password must be at least 8 characters', email, name });

		const res = await authFetch('/api/auth/sign-up/email', {
			method: 'POST',
			body: JSON.stringify({ name, email, password })
		});

		if (!res.ok) {
			// better-auth answers 422 when the email is already registered.
			return fail(400, {
				message: res.status === 422 ? 'An account with this email already exists' : 'Registration failed',
				email,
				name
			});
		}

		// Account created AND signed in — transfer session cookies.
		applySetCookies(event.cookies, res.headers.getSetCookie());

		redirect(302, '/');
	},

	/**
	 * GitHub "sign-up" is really just social sign-in: better-auth creates the
	 * account automatically on first login (and signs into an existing one).
	 */
	github: async () => {
		const res = await authFetch('/api/auth/sign-in/social', {
			method: 'POST',
			body: JSON.stringify({ provider: 'github', callbackURL: '/' })
		});

		if (!res.ok) return fail(400, { message: 'GitHub sign-up failed' });

		const data = await res.json();
		if (data?.url) redirect(302, data.url);

		return fail(400, { message: 'GitHub sign-up failed' });
	}
};
