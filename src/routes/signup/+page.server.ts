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

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) redirect(302, '/');
	return {};
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
	}
};
