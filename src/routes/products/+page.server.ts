import type { PageServerLoad } from './$types';
import { getBrands, getCategoriesWithCounts, listProducts } from '$lib/server/catalog';
import type { SortOption } from '$lib/types';

const VALID_SORTS = new Set(['newest', 'price-asc', 'price-desc', 'name']);

export const load: PageServerLoad = async ({ url }) => {
	const params = url.searchParams;

	const q = params.get('q')?.trim() || undefined;
	const brands = params.getAll('brand').filter(Boolean);
	const category = params.get('category') || undefined;
	const sortParam = params.get('sort') ?? 'newest';
	const sort: SortOption = (
		VALID_SORTS.has(sortParam) ? sortParam : 'newest'
	) as SortOption;
	const minPriceCents = parsePrice(params.get('min'));
	const maxPriceCents = parsePrice(params.get('max'));
	const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1);

	const [result, allBrands, categories] = await Promise.all([
		listProducts({ q, brands, category, sort, minPriceCents, maxPriceCents, page }),
		getBrands(),
		getCategoriesWithCounts()
	]);

	return { result, filters: { q, brands, category, sort, min: params.get('min'), max: params.get('max') }, allBrands, categories };
};

function parsePrice(value: string | null): number | undefined {
	if (!value) return undefined;
	const dollars = Number.parseFloat(value);
	if (Number.isNaN(dollars) || dollars < 0) return undefined;
	return Math.round(dollars * 100);
}
