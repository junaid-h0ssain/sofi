/**
 * ============================================================================
 * LOGIN PAGE — server side
 * ============================================================================
 *
 * Two concepts working together here:
 *
 * 1. `load` — runs on GET, prepares data for the page.
 *    If you're already signed in there's no point showing the form, so we
 *    redirect home instead.
 *
 * 2. `actions` — named POST handlers ("form actions"). A <form> in the page
 *    posts to `?/signin`, SvelteKit matches that name and runs this function.
 *    This works even with JavaScript disabled — no API endpoints needed!
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
	/** Email + password login. */
	signin: async (event) => {
		const formData = await event.request.formData();
		const email = String(formData.get('email') ?? '').trim();
		const password = String(formData.get('password') ?? '');

		// Return `fail(...)` to re-render the page WITH these values available
		// as the `form` prop (used to show the error message).
		if (!email || !password) return fail(400, { message: 'Email and password are required', email });

		try {
			// On success better-auth sets a session cookie automatically
			// (via sveltekitCookies in auth.ts). Every later request is logged in.
			await auth.api.signInEmail({ body: { email, password } });
		} catch (error) {
			if (error instanceof APIError) {
				// Deliberately vague: never reveal whether it was email OR password
				// that was wrong (helps attackers guess accounts).
				return fail(400, { message: 'Invalid email or password', email });
			}
			return fail(500, { message: 'Unexpected error, please try again', email });
		}

		redirect(302, '/'); // 302 = "see other page"
	},

	/** Start the GitHub OAuth dance by redirecting to github.com. */
	github: async () => {
		const result = await auth.api.signInSocial({
			body: { provider: 'github', callbackURL: '/' }
		});
		// Send the browser to GitHub's consent screen.
		if (result.url) redirect(302, result.url);
		return fail(400, { message: 'GitHub sign-in failed' });
	}
};
