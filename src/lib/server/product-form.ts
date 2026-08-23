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

export function parseProductForm(formData: FormData):
	| { ok: true; data: ParsedProduct }
	| { ok: false; message: string } {
	const name = String(formData.get('name') ?? '').trim();
	const description = String(formData.get('description') ?? '').trim();
	const priceDollars = Number.parseFloat(String(formData.get('price') ?? ''));
	const stock = Number.parseInt(String(formData.get('stock') ?? ''), 10);
	const brandId = String(formData.get('brandId') ?? '');
	const categoryId = String(formData.get('categoryId') ?? '');
	const imageUrl = String(formData.get('imageUrl') ?? '').trim() || null;
	const featured = formData.get('featured') ? 1 : 0;
	const specsRaw = String(formData.get('specs') ?? '');

	if (!name) return { ok: false, message: 'Name is required' };
	if (!Number.isFinite(priceDollars) || priceDollars < 0)
		return { ok: false, message: 'A valid price is required' };
	if (!Number.isInteger(stock) || stock < 0) return { ok: false, message: 'Stock must be a non-negative integer' };
	if (!brandId) return { ok: false, message: 'Brand is required' };
	if (!categoryId) return { ok: false, message: 'Category is required' };

	const specs: Record<string, string> = {};
	for (const line of specsRaw.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		const separatorIndex = trimmed.indexOf(':');
		if (separatorIndex < 1) continue;
		const key = trimmed.slice(0, separatorIndex).trim();
		const value = trimmed.slice(separatorIndex + 1).trim();
		if (key) specs[key] = value;
	}

	return {
		ok: true,
		data: {
			name,
			slug: slugify(name),
			description,
			priceCents: Math.round(priceDollars * 100),
			stock,
			brandId,
			categoryId,
			imageUrl,
			featured,
			specs
		}
	};
}

export function specsToText(specs: Record<string, string>): string {
	return Object.entries(specs)
		.map(([key, value]) => `${key}: ${value}`)
		.join('\n');
}
