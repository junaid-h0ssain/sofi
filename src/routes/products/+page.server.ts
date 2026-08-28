/**
 * ============================================================================
 * CATALOG PAGE (/products) — server side (now a thin BFF)
 * ============================================================================
 *
 * KEY IDEA unchanged: all filters live in the URL (?q=…&brand=…&category=…).
 * The difference: instead of querying Drizzle directly, we translate URL
 * params into an API call. The .NET API does filtering/sorting/paging.
 */
import type { PageServerLoad } from './$types';
import { catalogApi } from '$lib/server/api';
import type { SortOption } from '$lib/types';

// Whitelist: never trust user input blindly. An unexpected ?sort= value
// silently falls back to 'newest' (the API validates this too — defense in depth).
const VALID_SORTS = new Set(['newest', 'price-asc', 'price-desc', 'name']);

export const load: PageServerLoad = async ({ url }) => {
	// getAll() collects repeated params: ?brand=apple&brand=sony → ['apple','sony']
	const params = url.searchParams;

	const q = params.get('q')?.trim() || undefined;
	const brands = params.getAll('brand').filter(Boolean);
	const categories = params.getAll('category').filter(Boolean);
	const sortParam = params.get('sort') ?? 'newest';
	const sort: SortOption = (
		VALID_SORTS.has(sortParam) ? sortParam : 'newest'
	) as SortOption;
	const min = parseDollars(params.get('min'));
	const max = parseDollars(params.get('max'));
	const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1);

	// Fetch page data AND sidebar options at the same time.
	const [result, allBrands, allCategories] = await Promise.all([
		catalogApi.list({ q, brands, categories, sort, min, max, page }),
		catalogApi.brands(),
		catalogApi.categories()
	]);

	return {
		result,
		// Echo raw filter values so form inputs stay filled after navigation.
		filters: { q, brands, categories, sort, min: params.get('min'), max: params.get('max') },
		allBrands,
		categories: allCategories
	};
};

/** "$12" or "12" → 12 (dollars). Returns undefined for empty/garbage input. */
function parseDollars(value: string | null): number | undefined {
	if (!value) return undefined;
	const dollars = Number.parseFloat(value);
	return Number.isNaN(dollars) || dollars < 0 ? undefined : dollars;
}
