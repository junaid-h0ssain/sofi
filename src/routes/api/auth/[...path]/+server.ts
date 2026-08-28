/**
 * ============================================================================
 * /api/auth/[...path] — transparent proxy to the better-auth service
 * ============================================================================
 *
 * Why proxy instead of calling the auth service directly from the browser?
 *   - Cookies stay on THIS origin (no CORS, no third-party cookie pain)
 *   - The auth service stays private to the docker network
 *
 * Everything is forwarded 1:1: method, body, cookies, and — crucially —
 * Set-Cookie headers (a sign-in response may carry SEVERAL).
 */
import type { RequestHandler } from './$types';
import { AUTH_SERVICE_URL } from '$lib/server/config';

// Headers that must be rebuilt for a server-to-server hop, not copied.
const HOP_HEADERS = new Set(['host', 'connection', 'content-length', 'accept-encoding']);

async function proxy(event: Parameters<RequestHandler>[0]): Promise<Response> {
	const { request, url, params } = event;

	const target = `${AUTH_SERVICE_URL}/api/auth/${params.path}${url.search}`;

	// Copy safe headers (content-type, cookie, origin, …).
	const headers = new Headers();
	for (const [name, value] of request.headers) {
		if (!HOP_HEADERS.has(name.toLowerCase())) headers.set(name, value);
	}

	// Body: GET/HEAD must not carry one; otherwise pass the raw bytes through.
	const hasBody = !['GET', 'HEAD'].includes(request.method);
	const body = hasBody ? await request.arrayBuffer() : undefined;

	const authResponse = await fetch(target, {
		method: request.method,
		headers,
		body,
		redirect: 'manual' // OAuth callbacks return redirects we must relay as-is
	});

	// Rebuild response headers so MULTIPLE Set-Cookie lines survive.
	const responseHeaders = new Headers();
	for (const [name, value] of authResponse.headers) {
		if (name.toLowerCase() !== 'set-cookie') responseHeaders.set(name, value);
	}
	for (const cookie of authResponse.headers.getSetCookie()) {
		responseHeaders.append('set-cookie', cookie);
	}

	return new Response(authResponse.body, {
		status: authResponse.status,
		headers: responseHeaders
	});
}

export const GET: RequestHandler = proxy;
export const POST: RequestHandler = proxy;
