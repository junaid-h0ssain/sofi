import type { Session } from 'better-auth';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface LocalsUser {
			id: string;
			name: string;
			email: string;
			image?: string | null;
			emailVerified: boolean;
			createdAt: Date;
			updatedAt: Date;
			/** Present because the better-auth `admin()` plugin is enabled. */
			role?: string | null;
			banned?: boolean | null;
		}

		interface Locals {
			user?: LocalsUser;
			session?: Session;
		}

		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
