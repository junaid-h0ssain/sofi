/**
 * ============================================================================
 * CATALOG — every read query for brands / categories / products
 * ============================================================================
 *
 * Keeping queries in one module means page components stay thin: a +page.server.ts
 * just calls `listProducts(...)` and hands the result to its HTML.
 *
 * All of this runs ONLY on the server (it imports the database client), which
 * SvelteKit enforces because it lives under src/lib/server/.
 */
import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or, sql, type SQL } from 'drizzle-orm';
import { db } from './db';
import { brand, category, product } from './db/schema';
import type { Brand, Category, CategoryWithCount, ProductWithRelations, SortOption } from '$lib/types';

export type Product = typeof product.$inferSelect;

/** How many products show per catalog page. */
export const PER_PAGE = 12;

/**
 * Everything the catalog page can filter by.
 * These values come straight from URL search params (see products/+page.server.ts),
 * which makes filtered views shareable/bookmarkable links.
 */
export interface CatalogFilters {
	q?: string; // free-text search
	brands?: string[]; // brand slugs, e.g. ['apple', 'sony']
	categories?: string[]; // category slugs
	sort?: SortOption;
	minPriceCents?: number;
	maxPriceCents?: number;
	page?: number;
}

/**
 * Translate filters into one SQL WHERE clause.
 *
 * Drizzle trick: `and()` combines conditions; passing it an empty array would
 * be an error, so when there are no filters we return `undefined`, and
 * `.where(undefined)` simply applies no restriction at all.
 */
function buildWhere(filters: CatalogFilters): SQL | undefined {
	const conditions: SQL[] = [];

	if (filters.q) {
		// ilike = case-insensitive "contains". We wrap the term in % wildcards.
		// `or(...)` matches if EITHER name or description contains the text.
		const term = `%${filters.q}%`;
		const search = or(ilike(product.name, term), ilike(product.description, term));
		if (search) conditions.push(search);
	}
	if (filters.brands?.length) {
		// SQL: WHERE brand.slug IN ('apple', 'sony', ...)
		conditions.push(inArray(brand.slug, filters.brands));
	}
	if (filters.categories?.length) {
		conditions.push(inArray(category.slug, filters.categories));
	}
	if (filters.minPriceCents !== undefined) {
		conditions.push(gte(product.priceCents, filters.minPriceCents)); // >=
	}
	if (filters.maxPriceCents !== undefined) {
		conditions.push(lte(product.priceCents, filters.maxPriceCents)); // <=
	}

	return conditions.length ? and(...conditions) : undefined;
}

/** Map a sort choice to SQL ORDER BY expressions. */
function orderBy(sort: SortOption = 'newest') {
	switch (sort) {
		case 'price-asc':
			return [asc(product.priceCents)];
		case 'price-desc':
			return [desc(product.priceCents)];
		case 'name':
			return [asc(product.name)];
		default:
			return [desc(product.createdAt)];
	}
}

/**
 * The main catalog query: one page of products + the total match count.
 *
 * Because we INNER JOIN brand and category, each result row already contains
 * the full brand/category objects — no extra round trips in the UI later.
 */
export async function listProducts(filters: CatalogFilters) {
	const page = Math.max(1, filters.page ?? 1);
	const where = buildWhere(filters);

	// `.limit(...).offset(...)` is classic pagination:
	// page 1 → offset 0, page 2 → offset 12, ...
	const products = await db
		.select({ product, brand, category })
		.from(product)
		.innerJoin(brand, eq(product.brandId, brand.id))
		.innerJoin(category, eq(product.categoryId, category.id))
		.where(where)
		.orderBy(...orderBy(filters.sort))
		.limit(PER_PAGE)
		.offset((page - 1) * PER_PAGE);

	// A second tiny query counts how many rows match IN TOTAL, so the UI can
	// render "34 products found" and page buttons. count() becomes COUNT(*).
	const [{ value: total }] = await db
		.select({ value: count() })
		.from(product)
		.innerJoin(brand, eq(product.brandId, brand.id))
		.innerJoin(category, eq(product.categoryId, category.id))
		.where(where);

	return {
		products: products.map((row) => ({
			...row.product,
			brand: row.brand,
			category: row.category
		})) satisfies ProductWithRelations[],
		total,
		page,
		pages: Math.max(1, Math.ceil(total / PER_PAGE))
	};
}

/** Fetch one product for the detail page. Returns null if the slug is unknown. */
export async function getProductBySlug(slug: string): Promise<ProductWithRelations | null> {
	const rows = await db
		.select({ product, brand, category })
		.from(product)
		.innerJoin(brand, eq(product.brandId, brand.id))
		.innerJoin(category, eq(product.categoryId, category.id))
		.where(eq(product.slug, slug))
		.limit(1);

	return rows.length ? { ...rows[0].product, brand: rows[0].brand, category: rows[0].category } : null;
}

/** "More in this category" section on the detail page. */
export async function getRelatedProducts(
	categoryId: string,
	excludeProductId: string,
	limit = 4
): Promise<ProductWithRelations[]> {
	const rows = await db
		.select({ product, brand, category })
		.from(product)
		.innerJoin(brand, eq(product.brandId, brand.id))
		.innerJoin(category, eq(product.categoryId, category.id))
		// sql`` lets us drop to raw SQL when no helper exists:
		// exclude the product currently being viewed.
		.where(and(eq(product.categoryId, categoryId), sql`${product.id} <> ${excludeProductId}`))
		.orderBy(desc(product.featured), desc(product.createdAt))
		.limit(limit);

	return rows.map((row) => ({ ...row.product, brand: row.brand, category: row.category }));
}

/** Products flagged featured=1, shown on the homepage. */
export async function getFeaturedProducts(limit = 8): Promise<ProductWithRelations[]> {
	const rows = await db
		.select({ product, brand, category })
		.from(product)
		.innerJoin(brand, eq(product.brandId, brand.id))
		.innerJoin(category, eq(product.categoryId, category.id))
		.where(eq(product.featured, 1))
		.orderBy(desc(product.createdAt))
		.limit(limit);

	return rows.map((row) => ({ ...row.product, brand: row.brand, category: row.category }));
}

/** Alphabetical brand list for the filter sidebar. */
export async function getBrands(): Promise<Brand[]> {
	return db.select().from(brand).orderBy(asc(brand.name));
}

/**
 * Categories with a product count each ("Laptops (5)").
 * leftJoin keeps categories with zero products visible; GROUP BY collapses
 * the joined rows so count() can tally products per category.
 */
export async function getCategoriesWithCounts() {
	return db
		.select({
			id: category.id,
			name: category.name,
			slug: category.slug,
			productCount: count(product.id)
		})
		.from(category)
		.leftJoin(product, eq(product.categoryId, category.id))
		.groupBy(category.id)
		.orderBy(asc(category.name));
}
