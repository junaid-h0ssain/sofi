/**
 * ============================================================================
 * DATABASE CLIENT — the single connection used by the whole app
 * ============================================================================
 *
 * Neon is a serverless Postgres provider. Instead of a persistent socket, the
 * "neon-http" driver sends each query as an HTTPS request — simple and fast
 * for serverless hosting.
 *
 * Trade-off to know about: this driver does NOT support interactive
 * transactions (`db.transaction(...)` throws). Where we need several writes
 * to succeed or fail together (checkout!), we use `db.batch([...])` instead —
 * it sends all statements in one request that Postgres executes atomically.
 */
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

// $env/dynamic/private reads variables from .env at runtime.
// Fail fast if the app is misconfigured rather than erroring mid-request.
if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const client = neon(env.DATABASE_URL);

// Passing `schema` enables the relational query API (db.query.product.findMany).
export const db = drizzle(client, { schema });
