/**
 * ============================================================================
 * PRODUCT FORM PARSER — shared by "new" and "edit" admin pages
 * ============================================================================
 *
 * HTML forms submit everything as strings, so we need one place that turns
 * raw FormData into validated, typed values. Sharing it between the create
 * and update actions means both behave identically.
 */
import { slugify } from '$lib/utils/slug';

export interface ParsedProduct {
	name: string;
	slug: string;
	description: string;
	priceCents: number;
	stock: number;
	brandId: string;
	categoryId: string;
	imageUrl: string | null;
	featured: number;
	specs: Record<string, string>;
}

/**
 * Parse & validate the product form.
 * Returns either `{ ok: true, data }` or `{ ok: false, message }` — a plain
 * TypeScript discriminated union that forces callers to check `.ok` first.
 */
export function parseProductForm(formData: FormData):
	| { ok: true; data: ParsedProduct }
	| { ok: false; message: string } {
	// FormData.get returns FormDataValue | null → String(...) + ?? '' normalizes.
	const name = String(formData.get('name') ?? '').trim();
	const description = String(formData.get('description') ?? '').trim();
	const priceDollars = Number.parseFloat(String(formData.get('price') ?? ''));
	const stock = Number.parseInt(String(formData.get('stock') ?? ''), 10);
	const brandId = String(formData.get('brandId') ?? '');
	const categoryId = String(formData.get('categoryId') ?? '');
	const imageUrl = String(formData.get('imageUrl') ?? '').trim() || null;
	// Unchecked checkboxes simply don't appear in the submission at all.
	const featured = formData.get('featured') ? 1 : 0;
	const specsRaw = String(formData.get('specs') ?? '');

	// --- validation: return the FIRST problem as a friendly message ---
	if (!name) return { ok: false, message: 'Name is required' };
	if (!Number.isFinite(priceDollars) || priceDollars < 0)
		return { ok: false, message: 'A valid price is required' };
	if (!Number.isInteger(stock) || stock < 0) return { ok: false, message: 'Stock must be a non-negative integer' };
	if (!brandId) return { ok: false, message: 'Brand is required' };
	if (!categoryId) return { ok: false, message: 'Category is required' };

	/**
	 * Specs come from a textarea, one "Key: Value" per line:
	 *   RAM: 16 GB
	 *   Screen: 14-inch
	 * We split on lines, then on the FIRST colon (values may contain colons).
	 */
	const specs: Record<string, string> = {};
	for (const line of specsRaw.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		const separatorIndex = trimmed.indexOf(':');
		if (separatorIndex < 1) continue; // no colon → skip the line
		const key = trimmed.slice(0, separatorIndex).trim();
		const value = trimmed.slice(separatorIndex + 1).trim();
		if (key) specs[key] = value;
	}

	return {
		ok: true,
		data: {
			name,
			slug: slugify(name), // slug always derives from the name
			description,
			priceCents: Math.round(priceDollars * 100), // dollars → whole cents
			stock,
			brandId,
			categoryId,
			imageUrl,
			featured,
			specs
		}
	};
}

/** Inverse of the parser: JSONB specs → textarea text for the edit form. */
export function specsToText(specs: Record<string, string>): string {
	return Object.entries(specs)
		.map(([key, value]) => `${key}: ${value}`)
		.join('\n');
}
