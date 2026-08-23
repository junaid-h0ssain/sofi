/**
 * Promote a user to admin — run with `bun run db:admin <email>`.
 */
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { user } from './schema';

const email = process.argv[2];
if (!email) {
	console.error('Usage: bun run db:admin <email>');
	process.exit(1);
}

const client = neon(process.env.DATABASE_URL ?? '');
const db = drizzle(client);

const result = await db
	.update(user)
	.set({ role: 'admin' })
	.where(eq(user.email, email.toLowerCase()))
	.returning({ id: user.id, name: user.name });

if (result.length === 0) {
	console.error(`No user found with email ${email}`);
	process.exit(1);
}

console.log(`✔ ${result[0].name} (${email}) is now an admin. Sign out and back in to refresh the session.`);
