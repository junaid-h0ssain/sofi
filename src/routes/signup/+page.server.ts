/**
 * SIGNUP PAGE — server side.
 * Validates the form manually (no external validation library needed) and
 * hands the values to better-auth, which hashes the password and creates
 * the user row.
 */
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { APIError } from 'better-auth/api';
import { auth } from '$lib/server/auth';
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

		try {
			await auth.api.signUpEmail({ body: { name, email, password } });
		} catch (error) {
			if (error instanceof APIError) {
				// better-auth answers 422 when the email is already registered.
				return fail(400, {
					message:
						error.status === 422 ? 'An account with this email already exists' : 'Registration failed',
					email,
					name
				});
			}
			return fail(500, { message: 'Unexpected error, please try again', email, name });
		}

		// Account created AND signed in (better-auth sets the session cookie).
		redirect(302, '/');
	},

	/**
	 * GitHub "sign-up" is really just social sign-in: better-auth creates the
	 * account automatically on first login (and signs into an existing one).
	 */
	github: async () => {
		const result = await auth.api.signInSocial({
			body: { provider: 'github', callbackURL: '/' }
		});
		// Send the browser to GitHub's consent screen.
		if (result.url) redirect(302, result.url);
		return fail(400, { message: 'GitHub sign-up failed' });
	}
};
