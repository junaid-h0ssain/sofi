import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or, sql, type SQL } from 'drizzle-orm';
import { db } from './db';
import { brand, category, product } from './db/schema';
import type { Brand, Category, CategoryWithCount, ProductWithRelations, SortOption } from '$lib/types';

export type Product = typeof product.$inferSelect;

export const PER_PAGE = 12;

export interface CatalogFilters {
	q?: string;
	brands?: string[];
	category?: string;
	sort?: SortOption;
	minPriceCents?: number;
	maxPriceCents?: number;
	page?: number;
}

function buildWhere(filters: CatalogFilters): SQL | undefined {
	const conditions: SQL[] = [];

	if (filters.q) {
		const term = `%${filters.q}%`;
		const search = or(ilike(product.name, term), ilike(product.description, term));
		if (search) conditions.push(search);
	}
	if (filters.brands?.length) {
		conditions.push(inArray(brand.slug, filters.brands));
	}
	if (filters.category) {
		conditions.push(eq(category.slug, filters.category));
	}
	if (filters.minPriceCents !== undefined) {
		conditions.push(gte(product.priceCents, filters.minPriceCents));
	}
	if (filters.maxPriceCents !== undefined) {
		conditions.push(lte(product.priceCents, filters.maxPriceCents));
	}

	return conditions.length ? and(...conditions) : undefined;
}

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

export async function listProducts(filters: CatalogFilters) {
	const page = Math.max(1, filters.page ?? 1);
	const where = buildWhere(filters);

	const products = await db
		.select({ product, brand, category })
		.from(product)
		.innerJoin(brand, eq(product.brandId, brand.id))
		.innerJoin(category, eq(product.categoryId, category.id))
		.where(where)
		.orderBy(...orderBy(filters.sort))
		.limit(PER_PAGE)
		.offset((page - 1) * PER_PAGE);

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
		.where(and(eq(product.categoryId, categoryId), sql`${product.id} <> ${excludeProductId}`))
		.orderBy(desc(product.featured), desc(product.createdAt))
		.limit(limit);

	return rows.map((row) => ({ ...row.product, brand: row.brand, category: row.category }));
}

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

export async function getBrands(): Promise<Brand[]> {
	return db.select().from(brand).orderBy(asc(brand.name));
}

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
