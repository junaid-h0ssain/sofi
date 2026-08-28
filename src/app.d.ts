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
			createdAt: string;
			updatedAt: string;
			/** Present because the better-auth `admin()` plugin is enabled. */
			role?: string | null;
			banned?: boolean | null;
		}

		interface Locals {
			/** Populated by hooks.server.ts after validating cookies with the auth service. */
			user?: LocalsUser;

			/**
			 * The PLAIN better-auth session token (from get-session, not the raw
			 * signed cookie). Forwarded to the .NET API as a Bearer token for
			 * every authenticated call in +page.server.ts files.
			 */
			sessionToken?: string;
		}

		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
