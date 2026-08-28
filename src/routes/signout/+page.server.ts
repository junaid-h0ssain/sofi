import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { authFetch, applySetCookies } from '$lib/server/auth-proxy';

export const actions: Actions = {
	default: async (event) => {
		// Tell the auth service to delete the session row; it responds with
		// Set-Cookie headers that CLEAR the browser cookies.
		const res = await authFetch('/api/auth/sign-out', {
			method: 'POST',
			cookieHeader: event.request.headers.get('cookie') ?? undefined
		});

		if (res.ok) {
			applySetCookies(event.cookies, res.headers.getSetCookie());
		}

		redirect(302, '/');
	}
};
