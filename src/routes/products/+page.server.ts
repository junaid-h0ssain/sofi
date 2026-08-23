/**
 * ============================================================================
 * CATALOG PAGE (/products) — server side
 * ============================================================================
 *
 * KEY IDEA: all filters live in the URL (?q=…&brand=…&category=…&sort=…).
 * The `load` function reads those params and queries the database accordingly.
 *
 * Benefits of this "URL is state" pattern:
 *   - filtered views are shareable/bookmarkable links
 *   - browser back/forward just works
 *   - works without JavaScript (plain HTML forms submit GET requests)
 */
import type { PageServerLoad } from './$types';
import { getBrands, getCategoriesWithCounts, listProducts } from '$lib/server/catalog';
import type { SortOption } from '$lib/types';

// Whitelist: never trust user input blindly. An unexpected ?sort= value
// silently falls back to 'newest'.
const VALID_SORTS = new Set(['newest', 'price-asc', 'price-desc', 'name']);

export const load: PageServerLoad = async ({ url }) => {
	// url.searchParams is the standard Web API for query strings.
	// getAll() collects repeated params: ?brand=apple&brand=sony → ['apple','sony']
	const params = url.searchParams;

	const q = params.get('q')?.trim() || undefined;
	const brands = params.getAll('brand').filter(Boolean);
	const categories = params.getAll('category').filter(Boolean);
	const sortParam = params.get('sort') ?? 'newest';
	const sort: SortOption = (
		VALID_SORTS.has(sortParam) ? sortParam : 'newest'
	) as SortOption;
	// Prices are typed in dollars but stored in cents → convert here.
	const minPriceCents = parsePrice(params.get('min'));
	const maxPriceCents = parsePrice(params.get('max'));
	const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1);

	// Fetch page data AND sidebar options at the same time.
	const [result, allBrands, allCategories] = await Promise.all([
		listProducts({ q, brands, categories, sort, minPriceCents, maxPriceCents, page }),
		getBrands(),
		getCategoriesWithCounts()
	]);

	return {
		result,
		// Echo the raw filter values back so the form inputs stay filled.
		filters: { q, brands, categories, sort, min: params.get('min'), max: params.get('max') },
		allBrands,
		categories: allCategories
	};
};

/** "$12" or "12" → 1200 cents. Returns undefined for empty/garbage input. */
function parsePrice(value: string | null): number | undefined {
	if (!value) return undefined;
	const dollars = Number.parseFloat(value);
	if (Number.isNaN(dollars) || dollars < 0) return undefined;
	return Math.round(dollars * 100);
}
