import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { APIError } from 'better-auth/api';
import { auth } from '$lib/server/auth';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) redirect(302, '/');
	return { hasGithub: Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) };
};

export const actions: Actions = {
	signin: async (event) => {
		const formData = await event.request.formData();
		const email = String(formData.get('email') ?? '').trim();
		const password = String(formData.get('password') ?? '');

		if (!email || !password) return fail(400, { message: 'Email and password are required', email });

		try {
			await auth.api.signInEmail({ body: { email, password } });
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { message: 'Invalid email or password', email });
			}
			return fail(500, { message: 'Unexpected error, please try again', email });
		}

		redirect(302, '/');
	},
	github: async () => {
		const result = await auth.api.signInSocial({
			body: { provider: 'github', callbackURL: '/' }
		});
		if (result.url) redirect(302, result.url);
		return fail(400, { message: 'GitHub sign-in failed' });
	}
};
