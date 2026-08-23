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

export * from './auth.schema';

/* ------------------------------ catalog ------------------------------ */

export const brand = pgTable(
	'brand',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		slug: text('slug').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(t) => [
		uniqueIndex('brand_slug_idx').on(t.slug),
		pgPolicy('brand_public_read', { for: 'select', to: 'public', using: sql`true` })
	]
).enableRLS();

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
		featured: integer('featured').notNull().default(0),
		brandId: text('brand_id')
			.notNull()
			.references(() => brand.id, { onDelete: 'restrict' }),
		categoryId: text('category_id')
			.notNull()
			.references(() => category.id, { onDelete: 'restrict' }),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(t) => [
		uniqueIndex('product_slug_idx').on(t.slug),
		index('product_brand_idx').on(t.brandId),
		index('product_category_idx').on(t.categoryId),
		index('product_price_idx').on(t.priceCents),
		pgPolicy('product_public_read', { for: 'select', to: 'public', using: sql`true` })
	]
).enableRLS();

/* ------------------------------- cart -------------------------------- */

export const cartItem = pgTable(
	'cart_item',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		productId: text('product_id')
			.notNull()
			.references(() => product.id, { onDelete: 'cascade' }),
		quantity: integer('quantity').notNull().default(1),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(t) => [uniqueIndex('cart_user_product_idx').on(t.userId, t.productId)]
).enableRLS();

/* ------------------------------ orders ------------------------------- */

export const orderStatusEnum = pgEnum('order_status', [
	'paid',
	'shipped',
	'delivered',
	'cancelled'
]);

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
		fullName: text('full_name').notNull(),
		street: text('street').notNull(),
		city: text('city').notNull(),
		postalCode: text('postal_code').notNull(),
		country: text('country').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(t) => [index('order_user_idx').on(t.userId)]
).enableRLS();

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

/* ---------------------------- relations ------------------------------ */

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

