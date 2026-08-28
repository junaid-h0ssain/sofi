/**
 * Database client for the auth service — same pattern as the old
 * src/lib/server/db/index.ts (Neon serverless over HTTPS).
 *
 * IMPORTANT: this service OWNS the auth tables (user, session, account,
 * verification). Every other service treats them as read-only.
 */
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const client = neon(process.env.DATABASE_URL);

export const db = drizzle(client, { schema });
