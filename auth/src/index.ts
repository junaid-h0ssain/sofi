/**
 * ============================================================================
 * AUTH SERVICE ENTRYPOINT — tiny Hono app on Bun
 * ============================================================================
 *
 * Exposes exactly two things:
 *   GET  /health          → for docker healthchecks
 *   *    /api/auth/*      → handed 1:1 to better-auth's request handler
 *
 * The web app proxies /api/auth/* here, so cookies stay on the web origin
 * and no CORS configuration is needed.
 */
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { auth } from './auth';

const app = new Hono();

app.use(logger());

app.get('/health', (c) => c.json({ status: 'ok' }));

// Everything under /api/auth/* is better-auth: sign-up, sign-in,
// sign-out, get-session, OAuth callbacks, …
app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw));

// 404 fallback
app.notFound((c) => c.json({ error: 'Not found' }, 404));

const port = Number(process.env.PORT ?? 4000);

console.log(`auth service listening on http://localhost:${port}`);

export default {
	port,
	fetch: app.fetch
};
