/**
 * ============================================================================
 * SERVICE URLS — where the web app's SERVER code finds its backends
 * ============================================================================
 *
 * The browser never talks to these directly:
 *   - catalog/cart/checkout calls happen inside +page.server.ts (BFF)
 *   - /api/auth/* is proxied to the auth service (see routes/api/auth/[...path])
 *
 * PRIVATE_ prefix = server-only env vars, never exposed to client bundles.
 */
import { env } from '$env/dynamic/private';

/** The .NET API (SoFi.Api). */
export const API_URL =
	env.PRIVATE_API_URL ?? env.API_URL ?? 'http://localhost:5080';

/** The better-auth service (Hono + Bun). */
export const AUTH_SERVICE_URL =
	env.AUTH_SERVICE_URL ?? 'http://localhost:4000';

/** This app's public origin — sent as Origin so better-auth accepts requests. */
export const WEB_ORIGIN = env.ORIGIN ?? 'http://localhost:5173';
