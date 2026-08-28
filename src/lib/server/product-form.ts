/**
 * ============================================================================
 * PRODUCT FORM PARSER — shared by "new" and "edit" admin pages
 * ============================================================================
 *
 * HTML forms submit everything as strings, so we need one place that turns
 * raw FormData into a validated payload matching the .NET API's
 * SaveProductRequest contract (price in DOLLARS on the wire; the API
 * converts to cents before storing).
 */
import { slugify } from '$lib/utils/slug';

export interface ParsedProduct {
	name: string;
	slug: string;
	description: string;
	price: number; // dollars — the API stores ×100 as cents
	stock: number;
	brandId: string;
	categoryId: string;
	imageUrl?: string | null;
	featured: boolean;
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
	const name = String(formData.get('name') ?? '').trim();
	const description = String(formData.get('description') ?? '').trim();
	const priceDollars = Number.parseFloat(String(formData.get('price') ?? ''));
	const stock = Number.parseInt(String(formData.get('stock') ?? ''), 10);
	const brandId = String(formData.get('brandId') ?? '');
	const categoryId = String(formData.get('categoryId') ?? '');
	const rawImageUrl = String(formData.get('imageUrl') ?? '').trim();
	const featured = formData.get('featured') !== null; // unchecked boxes don't submit at all
	const specsRaw = String(formData.get('specs') ?? '');

	// --- validation: return the FIRST problem as a friendly message ---
	if (!name) return { ok: false, message: 'Name is required' };
	if (!Number.isFinite(priceDollars) || priceDollars < 0)
		return { ok: false, message: 'A valid price is required' };
	if (!Number.isInteger(stock) || stock < 0)
		return { ok: false, message: 'Stock must be a non-negative integer' };
	if (!brandId) return { ok: false, message: 'Brand is required' };
	if (!categoryId) return { ok: false, message: 'Category is required' };

	/**
	 * Specs come from a textarea, one "Key: Value" per line:
	 *   RAM: 16 GB
	 *   Screen: 14-inch
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
			price: priceDollars,
			stock,
			brandId,
			categoryId,
			imageUrl: rawImageUrl || null,
			featured,
			specs
		}
	};
}

/** JSONB object → "Key: Value" lines for the edit form's textarea. */
export function specsToText(specs: Record<string, string>): string {
	return Object.entries(specs)
		.map(([key, value]) => `${key}: ${value}`)
		.join('\n');
}
