/**
 * ============================================================================
 * AUTH PROXY HELPERS — bridge between the browser and the auth service
 * ============================================================================
 *
 * The browser holds better-auth cookies for THIS origin (the auth service is
 * proxied under /api/auth/*, see routes/api/auth/[...path]/+server.ts).
 *
 * Two jobs here:
 *   1. getSessionFromCookies(): validate those cookies against the auth
 *      service and return { user, token } — the PLAIN token from the session
 *      row (the cookie value itself is signed: "token.signature").
 *   2. applySetCookies(): copy Set-Cookie headers from an auth-service
 *      response onto SvelteKit's cookie store so sign-in/out state lands
 *      in the browser.
 */
import { AUTH_SERVICE_URL, WEB_ORIGIN } from './config';
import type { Cookies } from '@sveltejs/kit';

export interface SessionInfo {
	user: {
		id: string;
		name: string;
		email: string;
		image?: string | null;
		emailVerified?: boolean;
		createdAt?: string;
		updatedAt?: string;
		role?: string | null;
		banned?: boolean | null;
	};
	token: string;
}

/** Forward the browser's cookies to the auth service and read the session. */
export async function getSessionFromCookieHeader(cookieHeader: string): Promise<SessionInfo | null> {
	if (!cookieHeader.includes('better-auth.session_token')) return null;

	const res = await fetch(`${AUTH_SERVICE_URL}/api/auth/get-session`, {
		headers: { Cookie: cookieHeader }
	});

	if (!res.ok) return null;

	const data = await res.json();
	if (!data?.session?.token || !data?.user) return null;

	return { user: data.user, token: data.session.token };
}

/**
 * Apply every Set-Cookie header from an auth-service response to the outgoing
 * SvelteKit response. Parsing attributes manually because `cookies.set` takes
 * structured options rather than raw header strings.
 */
export function applySetCookies(cookies: Cookies, setCookieHeaders: string[]) {
	for (const header of setCookieHeaders) {
		const [firstPair, ...attributes] = header.split(';');
		const equalsIndex = firstPair.indexOf('=');
		if (equalsIndex <= 0) continue;

		const name = firstPair.slice(0, equalsIndex).trim();
		const value = firstPair.slice(equalsIndex + 1).trim();

		let path = '/';
		let httpOnly = false;
		let secure = false;
		let sameSite: 'strict' | 'lax' | 'none' = 'lax';
		let maxAge: number | undefined;

		for (const attr of attributes) {
			const [attrName, attrValue = ''] = attr.trim().split('=');
			switch (attrName.toLowerCase()) {
				case 'path': path = attrValue || '/'; break;
				case 'httponly': httpOnly = true; break;
				case 'secure': secure = true; break;
				case 'samesite': sameSite = (attrValue.toLowerCase() as typeof sameSite) || 'lax'; break;
				case 'max-age': maxAge = Number.parseInt(attrValue, 10); break;
			}
		}

		// Deleting a cookie = setting it with Max-Age=0 (empty value already comes from auth svc).
		// `encode` passthrough is CRITICAL: auth-service values are ALREADY
		// URL-encoded ("%3D" for "="); SvelteKit would double-encode otherwise.
		cookies.set(name, value, {
			path,
			httpOnly,
			secure,
			sameSite,
			maxAge,
			encode: (v) => v
		});
	}
}

/** Shared fetch options so every call to the auth service looks same-origin. */
export function authFetch(path: string, init: RequestInit & { cookieHeader?: string } = {}) {
	const headers = new Headers(init.headers);
	headers.set('Origin', WEB_ORIGIN);
	if (init.cookieHeader) headers.set('Cookie', init.cookieHeader);
	if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

	return fetch(`${AUTH_SERVICE_URL}${path}`, { ...init, headers });
}
