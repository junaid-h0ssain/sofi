/**
 * ============================================================================
 * DATABASE SCHEMA — the shape of our data
 * ============================================================================
 *
 * This file defines every table in our PostgreSQL database using Drizzle ORM.
 * Think of a schema as the "blueprint" for the database: each exported constant
 * becomes a table, and each property on it becomes a column.
 *
 * Drizzle gives us two big benefits:
 *   1. Type safety — TypeScript knows exactly what a `product` row looks like,
 *      so typos are caught before we ever run the app.
 *   2. A single source of truth — migrations (`bun run db:push`) read THIS file
 *      and create/update the actual SQL tables to match.
 *
 * How to read a table definition:
 *   export const brand = pgTable('brand', { ...columns }, (t) => [...extras])
 *                          └─ JS name    └─ SQL name    └─ columns   └─ indexes & policies
 */
import { relations, sql } from 'drizzle-orm';
import {
	index,
	integer,
	jsonb,
	pgEnum,
	pgPolicy,
	pgTable,
	text,
	timestamp,
	uniqueIndex
} from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

// Re-export better-auth's generated tables (user, session, account, …) so that
// everything lives under one import: `import * as schema from './schema'`.
export * from './auth.schema';

/* ------------------------------ catalog ------------------------------
 * The "public" part of the store: brands, categories and products.
 * Anyone (even not logged in) may READ these, but only our trusted server
 * may write to them — enforced by Row Level Security below.
 * --------------------------------------------------------------------- */

/**
 * Brands like "Apple" or "TP-Link".
 * `slug` is a URL-friendly name ("tp-link") used in links instead of the id,
 * e.g. /products?brand=apple — nicer to read and share.
 */
export const brand = pgTable(
	'brand',
	{
		// We generate ids in JavaScript with crypto.randomUUID() instead of letting
		// Postgres auto-increment. Text UUIDs match how better-auth identifies users,
		// and let us build "upsert" seeds and atomic multi-step writes later.
		id: text('id').primaryKey(),
		name: text('name').notNull(), // notNull = required column
		slug: text('slug').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(t) => [
		// Unique index = no two brands may share a slug. It also makes lookups
		// by slug fast, because the database keeps a sorted structure for it.
		uniqueIndex('brand_slug_idx').on(t.slug),

		// ---- ROW LEVEL SECURITY (RLS), part 1: the policy ----
		// A policy says WHO may touch WHICH rows. This one allows everyone
		// ("to public") to SELECT rows ("using: true" means "every row").
		// Note there is NO policy for insert/update/delete — those stay denied
		// for anyone who isn't the table owner (our server's connection).
		pgPolicy('brand_public_read', { for: 'select', to: 'public', using: sql`true` })
	]
		// ---- RLS, part 2: switch it on ----
		// Without this call, Postgres ignores policies entirely.
		// Drizzle-kit translates it into `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.
	).enableRLS();

/** Product categories: laptop, phone, router… (slugs match placeholder images). */
export const category = pgTable(
	'category',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		slug: text('slug').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(t) => [
		uniqueIndex('category_slug_idx').on(t.slug),
		pgPolicy('category_public_read', { for: 'select', to: 'public', using: sql`true` })
	]
).enableRLS();

/**
 * The central table of the shop.
 *
 * Design notes worth learning:
 * - `priceCents`: we NEVER store money as floats (0.1 + 0.2 !== 0.3 in floating
 *   point math!). Storing whole cents in an integer avoids rounding bugs.
 *   $1099.00 is stored as 109900 and formatted only when displayed.
 * - `specs`: a JSONB column holding flexible key/value pairs like
 *   { "RAM": "16 GB", "Screen": '14"' }. Laptops and routers need very
 *   different spec fields — JSONB lets us store both without extra tables.
 * - `brandId` / `categoryId`: foreign keys (`.references(...)`) linking each
 *   product to its brand and category row.
 */
export const product = pgTable(
	'product',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		slug: text('slug').notNull(),
		description: text('description').notNull().default(''),
		priceCents: integer('price_cents').notNull(),
		stock: integer('stock').notNull().default(0),
		imageUrl: text('image_url'),
		specs: jsonb('specs').$type<Record<string, string>>().default({}).notNull(),
		// SQLite-style boolean: 1 = featured on the homepage, 0 = not.
		featured: integer('featured').notNull().default(0),
		brandId: text('brand_id')
			.notNull()
			.references(() => brand.id, { onDelete: 'restrict' }), // restrict = can't delete a brand that still has products
		categoryId: text('category_id')
			.notNull()
			.references(() => category.id, { onDelete: 'restrict' }),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(t) => [
		uniqueIndex('product_slug_idx').on(t.slug),
		// Regular indexes speed up the filters we use on the catalog page:
		index('product_brand_idx').on(t.brandId),
		index('product_category_idx').on(t.categoryId),
		index('product_price_idx').on(t.priceCents),
		pgPolicy('product_public_read', { for: 'select', to: 'public', using: sql`true` })
	]
).enableRLS();

/* ------------------------------- cart -------------------------------- */

/**
 * One row = one product inside one user's cart.
 * The unique index on (userId, productId) guarantees a product appears at most
 * once per cart — adding it again simply increases `quantity`.
 * RLS is enabled WITHOUT any public policy: non-owner connections are locked
 * out completely. Only the server (which checks sessions itself) can read carts.
 */
export const cartItem = pgTable(
	'cart_item',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }), // cascade = deleting a user removes their cart too
		productId: text('product_id')
			.notNull()
			.references(() => product.id, { onDelete: 'cascade' }),
		quantity: integer('quantity').notNull().default(1),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(t) => [uniqueIndex('cart_user_product_idx').on(t.userId, t.productId)]
).enableRLS();

/* ------------------------------ orders ------------------------------- */

/**
 * An enum is a column that may only contain one of a fixed list of values.
 * Orders start as 'paid' (mock checkout) and could move through the rest.
 */
export const orderStatusEnum = pgEnum('order_status', [
	'paid',
	'shipped',
	'delivered',
	'cancelled'
]);

/**
 * An order is a snapshot of a checkout: who bought it, where to ship it,
 * and the totals AT THAT MOMENT. Prices live here (and on order_item), so
 * changing a product's price later never rewrites history.
 * `id` is a UUID we generate in JavaScript BEFORE inserting — this is what
 * lets us write the whole checkout as ONE atomic batch (see checkout/+page.server.ts).
 */
export const order = pgTable(
	'order',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		totalCents: integer('total_cents').notNull(),
		shippingCents: integer('shipping_cents').notNull().default(0),
		status: orderStatusEnum('status').notNull().default('paid'),
		// Shipping address, copied in at purchase time.
		fullName: text('full_name').notNull(),
		street: text('street').notNull(),
		city: text('city').notNull(),
		postalCode: text('postal_code').notNull(),
		country: text('country').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(t) => [index('order_user_idx').on(t.userId)]
).enableRLS();

/**
 * One line item of an order. We copy `productName` and `unitPriceCents` into
 * the row (denormalization!) so old orders still display correctly even if the
 * product is renamed, re-priced or deleted afterwards.
 */
export const orderItem = pgTable(
	'order_item',
	{
		id: text('id').primaryKey(),
		orderId: text('order_id')
			.notNull()
			.references(() => order.id, { onDelete: 'cascade' }),
		productId: text('product_id')
			.notNull()
			.references(() => product.id, { onDelete: 'restrict' }),
		productName: text('product_name').notNull(),
		unitPriceCents: integer('unit_price_cents').notNull(),
		quantity: integer('quantity').notNull()
	},
	(t) => [index('order_item_order_idx').on(t.orderId)]
).enableRLS();

/* ---------------------------- relations ------------------------------
 * Relations describe HOW tables connect for Drizzle's relational query API
 * (db.query.product.findMany({ with: { brand: true } })). They mirror the
 * foreign keys above but live separately, because SQL itself doesn't have a
 * notion of "with these related rows included".
 * --------------------------------------------------------------------- */

export const brandRelations = relations(brand, ({ many }) => ({
	products: many(product)
}));

export const categoryRelations = relations(category, ({ many }) => ({
	products: many(product)
}));

export const productRelations = relations(product, ({ one, many }) => ({
	brand: one(brand, { fields: [product.brandId], references: [brand.id] }),
	category: one(category, { fields: [product.categoryId], references: [category.id] }),
	cartItems: many(cartItem),
	orderItems: many(orderItem)
}));

export const cartItemRelations = relations(cartItem, ({ one }) => ({
	user: one(user, { fields: [cartItem.userId], references: [user.id] }),
	product: one(product, { fields: [cartItem.productId], references: [product.id] })
}));

export const orderRelations = relations(order, ({ one, many }) => ({
	user: one(user, { fields: [order.userId], references: [user.id] }),
	items: many(orderItem)
}));

export const orderItemRelations = relations(orderItem, ({ one }) => ({
	order: one(order, { fields: [orderItem.orderId], references: [order.id] }),
	product: one(product, { fields: [orderItem.productId], references: [product.id] })
}));
