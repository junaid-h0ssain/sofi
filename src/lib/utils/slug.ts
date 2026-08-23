/**
 * Turn any product name into a URL-friendly "slug".
 *
 *   slugify('MacBook Air 13" M3') → 'macbook-air-13-m3'
 *
 * Slugs are nicer than UUIDs in URLs (/products/macbook-air-13-m3) and are
 * made unique by a unique index in the database.
 */
export function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-') // any run of non-alphanumerics becomes one dash
		.replace(/^-+|-+$/g, ''); // trim leading/trailing dashes
}
