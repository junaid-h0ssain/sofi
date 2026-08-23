/**
 * ============================================================================
 * SEED SCRIPT — fill the store with realistic demo data
 * ============================================================================
 *
 * Run with:  bun run db:seed
 *
 * The script is IDEMPOTENT, meaning you can run it as many times as you like
 * without creating duplicates or errors. Two tricks make that work:
 *
 *   1. Fixed IDs ('brand_apple', 'prod_mbair-m3'…) instead of random UUIDs.
 *   2. Upserts via `.onConflictDoUpdate` — "insert this row, but if a row with
 *      the same primary key already exists, just update it instead."
 *
 * It creates its own database connection (instead of importing $lib/server/db)
 * so it can run standalone with Bun, outside of SvelteKit. Bun automatically
 * loads the .env file, which is where DATABASE_URL comes from.
 */
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { brand, category, product } from './schema';

const client = neon(process.env.DATABASE_URL ?? '');
const db = drizzle(client);

/* ------------------------------ brands ---------------------------------- */

const brands = [
	{ id: 'brand_apple', name: 'Apple', slug: 'apple' },
	{ id: 'brand_samsung', name: 'Samsung', slug: 'samsung' },
	{ id: 'brand_sony', name: 'Sony', slug: 'sony' },
	{ id: 'brand_tplink', name: 'TP-Link', slug: 'tp-link' },
	{ id: 'brand_logitech', name: 'Logitech', slug: 'logitech' },
	{ id: 'brand_lenovo', name: 'Lenovo', slug: 'lenovo' },
	{ id: 'brand_canon', name: 'Canon', slug: 'canon' },
	{ id: 'brand_garmin', name: 'Garmin', slug: 'garmin' }
];

/*
 * Category slugs are important: the UI looks up placeholder images at
 * /static/products/<slug>.svg, so slug 'laptop' ↔ laptop.svg must match.
 */
const categories = [
	{ id: 'cat_laptop', name: 'Laptops', slug: 'laptop' },
	{ id: 'cat_phone', name: 'Phones', slug: 'phone' },
	{ id: 'cat_tablet', name: 'Tablets', slug: 'tablet' },
	{ id: 'cat_router', name: 'Routers', slug: 'router' },
	{ id: 'cat_headphones', name: 'Headphones', slug: 'headphones' },
	{ id: 'cat_camera', name: 'Cameras', slug: 'camera' },
	{ id: 'cat_smartwatch', name: 'Smartwatches', slug: 'smartwatch' },
	{ id: 'cat_tv', name: 'TVs', slug: 'tv' }
];

/* ----------------------------- products --------------------------------- */

interface SeedProduct {
	id: string;
	name: string;
	description: string;
	priceCents: number; // remember: dollars × 100
	stock: number;
	featured?: boolean; // shown on the homepage
	specs: Record<string, string>; // flexible JSONB key/values
	brandId: string;
	categoryId: string;
}

const products: SeedProduct[] = [
	// Laptops
	{
		id: 'prod_mbair-m3',
		name: 'MacBook Air 13" M3',
		description: 'Impossibly thin laptop with the M3 chip, all-day battery life and a Liquid Retina display.',
		priceCents: 109900,
		stock: 14,
		featured: true,
		specs: { Chip: 'Apple M3', RAM: '8 GB unified', Storage: '256 GB SSD', Display: '13.6" Liquid Retina', Battery: 'Up to 18 h' },
		brandId: 'brand_apple',
		categoryId: 'cat_laptop'
	},
	{
		id: 'prod_mbpro-m4',
		name: 'MacBook Pro 16" M4 Pro',
		description: 'Pro performance for demanding workflows with a stunning mini-LED display.',
		priceCents: 249900,
		stock: 5,
		featured: true,
		specs: { Chip: 'Apple M4 Pro', RAM: '24 GB unified', Storage: '512 GB SSD', Display: '16.2" XDR', Battery: 'Up to 17 h' },
		brandId: 'brand_apple',
		categoryId: 'cat_laptop'
	},
	{
		id: 'prod_thinkpad-x1',
		name: 'ThinkPad X1 Carbon Gen 12',
		description: 'Legendary business ultrabook — carbon fiber chassis, best-in-class keyboard.',
		priceCents: 169900,
		stock: 9,
		specs: { CPU: 'Intel Core Ultra 7', RAM: '32 GB LPDDR5x', Storage: '1 TB NVMe', Display: '14" 2.8K OLED', Weight: '1.09 kg' },
		brandId: 'brand_lenovo',
		categoryId: 'cat_laptop'
	},
	{
		id: 'prod_ideapad-slim5',
		name: 'IdeaPad Slim 5 14"',
		description: 'Everyday laptop with solid build quality and great battery life at a friendly price.',
		priceCents: 64900,
		stock: 22,
		specs: { CPU: 'AMD Ryzen 7', RAM: '16 GB DDR5', Storage: '512 GB SSD', Display: '14" WUXGA', Battery: 'Up to 12 h' },
		brandId: 'brand_lenovo',
		categoryId: 'cat_laptop'
	},
	{
		id: 'prod_galaxybook4',
		name: 'Galaxy Book4 Pro',
		description: 'Sleek aluminum laptop with an AMOLED touchscreen and Galaxy ecosystem perks.',
		priceCents: 144900,
		stock: 7,
		specs: { CPU: 'Intel Core Ultra 7', RAM: '16 GB', Storage: '512 GB SSD', Display: '14" AMOLED touch', Battery: 'Up to 15 h' },
		brandId: 'brand_samsung',
		categoryId: 'cat_laptop'
	},

	// Phones
	{
		id: 'prod_iphone16pro',
		name: 'iPhone 16 Pro 128 GB',
		description: 'Titanium design, A18 Pro chip and a 48 MP Fusion camera system.',
		priceCents: 99900,
		stock: 30,
		featured: true,
		specs: { Chip: 'A18 Pro', Display: '6.3" Super Retina XDR', Camera: '48 MP + 48 MP UW + 12 MP 5x tele', Battery: 'Up to 23 h video' },
		brandId: 'brand_apple',
		categoryId: 'cat_phone'
	},
	{
		id: 'prod_iphonese4',
		name: 'iPhone SE (4th gen)',
		description: 'Compact flagship performance at an accessible price point.',
		priceCents: 42900,
		stock: 40,
		specs: { Chip: 'A18', Display: '6.1" LCD', Camera: '48 MP dual', Battery: 'Up to 20 h video' },
		brandId: 'brand_apple',
		categoryId: 'cat_phone'
	},
	{
		id: 'prod_s24ultra',
		name: 'Galaxy S24 Ultra 256 GB',
		description: 'Built-in S Pen, titanium frame and Galaxy AI features throughout.',
		priceCents: 119900,
		stock: 18,
		featured: true,
		specs: { Chip: 'Snapdragon 8 Gen 3', Display: '6.8" QHD+ AMOLED 120 Hz', Camera: '200 MP quad', SPen: 'Included' },
		brandId: 'brand_samsung',
		categoryId: 'cat_phone'
	},
	{
		id: 'prod_galaxya55',
		name: 'Galaxy A55 5G',
		description: 'Mid-range favorite with a bright AMOLED panel and four years of OS upgrades.',
		priceCents: 39900,
		stock: 35,
		specs: { Chip: 'Exynos 1480', Display: '6.6" AMOLED 120 Hz', Camera: '50 MP OIS', Battery: '5000 mAh' },
		brandId: 'brand_samsung',
		categoryId: 'cat_phone'
	},
	{
		id: 'prod_xperia10vi',
		name: 'Xperia 10 VI',
		description: 'Sony essentials: clean Android, headphone jack and marathon battery life.',
		priceCents: 44900,
		stock: 12,
		specs: { Chip: 'Snapdragon 6 Gen 1', Display: '6.1" OLED', Audio: '3.5 mm jack', Battery: '5000 mAh' },
		brandId: 'brand_sony',
		categoryId: 'cat_phone'
	},

	// Tablets
	{
		id: 'prod_ipadair-m2',
		name: 'iPad Air 11" M2',
		description: 'The versatile tablet — powerful enough for work, perfect for everything else.',
		priceCents: 59900,
		stock: 25,
		featured: true,
		specs: { Chip: 'Apple M2', Display: '11" Liquid Retina', Storage: '128 GB', Pencil: 'Supports Apple Pencil Pro' },
		brandId: 'brand_apple',
		categoryId: 'cat_tablet'
	},
	{
		id: 'prod_tab-s9',
		name: 'Galaxy Tab S9 FE+',
		description: 'Big-screen entertainment tablet with included S Pen and IP68 rating.',
		priceCents: 47900,
		stock: 15,
		specs: { Display: '12.4" LCD 90 Hz', Storage: '128 GB', Battery: '10090 mAh', Rating: 'IP68' },
		brandId: 'brand_samsung',
		categoryId: 'cat_tablet'
	},
	{
		id: 'prod_tab-p12',
		name: 'Tab Plus P12',
		description: 'Affordable family tablet with JBL-tuned speakers.',
		priceCents: 27900,
		stock: 28,
		specs: { Display: '12.7" 3K', Storage: '128 GB', Speakers: 'Quad JBL-tuned', Battery: '10200 mAh' },
		brandId: 'brand_lenovo',
		categoryId: 'cat_tablet'
	},

	// Routers
	{
		id: 'prod_deco-xe75',
		name: 'Deco XE75 AXE5400 Mesh (3-pack)',
		description: 'Tri-band Wi-Fi 6E mesh covering up to 650 m² with zero dead zones.',
		priceCents: 27900,
		stock: 20,
		featured: true,
		specs: { WiFi: 'Wi-Fi 6E AXE5400', Ports: '3× Gigabit per unit', Coverage: 'Up to 650 m²', Clients: '200+' },
		brandId: 'brand_tplink',
		categoryId: 'cat_router'
	},
	{
		id: 'prod_archer-ax55',
		name: 'Archer AX55 AX3000',
		description: 'Fast dual-band Wi-Fi 6 router with full gigabit ports and OneMesh support.',
		priceCents: 9990,
		stock: 45,
		specs: { WiFi: 'Wi-Fi 6 AX3000', Ports: 'Gigabit WAN + 4× LAN', VPN: 'OpenVPN/WireGuard', Coverage: 'Medium homes' },
		brandId: 'brand_tplink',
		categoryId: 'cat_router'
	},
	{
		id: 'prod_archer-be800',
		name: 'Archer BE800 BE19000',
		description: 'Flagship Wi-Fi 7 router with 10G port and a touchscreen.',
		priceCents: 57900,
		stock: 4,
		specs: { WiFi: 'Wi-Fi 7 BE19000', Ports: '10G WAN + 4× 2.5G LAN', Extras: 'Touchscreen, USB 3.0', Bands: 'Tri-band' },
		brandId: 'brand_tplink',
		categoryId: 'cat_router'
	},
	{
		id: 'prod_mesh-srs60',
		name: 'Sony Mesh Wi-Fi SRS60',
		description: 'Simple whole-home mesh tuned for stable streaming and gaming.',
		priceCents: 19900,
		stock: 11,
		specs: { WiFi: 'Wi-Fi 6 AX3000', Coverage: '2-pack, 350 m²', App: 'Full remote management' },
		brandId: 'brand_sony',
		categoryId: 'cat_router'
	},

	// Headphones
	{
		id: 'prod_wh1000xm6',
		name: 'WH-1000XM6 Wireless',
		description: 'Industry-leading noise cancellation with exceptional sound and comfort.',
		priceCents: 44900,
		stock: 26,
		featured: true,
		specs: { ANC: 'Adaptive, 8 mics', Battery: 'Up to 40 h', Codec: 'LDAC / AAC', Weight: '250 g' },
		brandId: 'brand_sony',
		categoryId: 'cat_headphones'
	},
	{
		id: 'prod_wf1000xm5',
		name: 'WF-1000XM5 Earbuds',
		description: 'Flagship true wireless earbuds with rich sound and compact fit.',
		priceCents: 27900,
		stock: 33,
		specs: { ANC: 'Integrated V2', Battery: '8 h + 16 h case', Codec: 'LDAC', Rating: 'IPX4' },
		brandId: 'brand_sony',
		categoryId: 'cat_headphones'
	},
	{
		id: 'prod_airpods-max',
		name: 'AirPods Max USB-C',
		description: 'Over-ear spatial audio with computational audio and premium build.',
		priceCents: 54900,
		stock: 8,
		specs: { Audio: 'Spatial + head tracking', Chip: 'H2', Battery: 'Up to 20 h', Case: 'Smart Case included' },
		brandId: 'brand_apple',
		categoryId: 'cat_headphones'
	},
	{
		id: 'prod_zone-vibe130',
		name: 'Zone Vibe 130',
		description: 'Lightweight wireless headset tuned for both calls and music.',
		priceCents: 12900,
		stock: 50,
		specs: { Mic: 'Dual beamforming', Battery: 'Up to 35 h', Connection: 'Bluetooth LE / USB-C' },
		brandId: 'brand_logitech',
		categoryId: 'cat_headphones'
	},
	{
		id: 'prod_airpods-pro3',
		name: 'AirPods Pro (3rd gen)',
		description: 'Best-in-class ANC earbuds with adaptive audio and hearing aid features.',
		priceCents: 24900,
		stock: 42,
		featured: true,
		specs: { Chip: 'H3', ANC: '2× stronger than AirPods Pro 2', Battery: '6 h + 24 h case', Rating: 'IP54' },
		brandId: 'brand_apple',
		categoryId: 'cat_headphones'
	},

	// Cameras
	{
		id: 'prod_eos-r7',
		name: 'EOS R7 Mirrorless',
		description: 'APS-C flagship speed: 32.5 MP sensor, 30 fps bursts, IBIS.',
		priceCents: 149900,
		stock: 6,
		specs: { Sensor: '32.5 MP APS-C', Burst: '30 fps electronic', Stabilization: 'IBIS 7 stops', Video: '4K60 oversampled' },
		brandId: 'brand_canon',
		categoryId: 'cat_camera'
	},
	{
		id: 'prod_eos-r50',
		name: 'EOS R50 Kit RF-S 18-45',
		description: 'Compact vlogging-ready mirrorless with dual pixel CMOS AF II.',
		priceCents: 79900,
		stock: 13,
		specs: { Sensor: '24.2 MP APS-C', Video: '4K30 uncropped', Screen: 'Vari-angle touch', Weight: '375 g' },
		brandId: 'brand_canon',
		categoryId: 'cat_camera'
	},
	{
		id: 'prod_zv1f',
		name: 'ZV-1F Vlogging Camera',
		description: 'Pocket vlog camera with ultra-wide 20 mm lens and product showcase AF.',
		priceCents: 51900,
		stock: 16,
		specs: { Sensor: '20 MP 1"', Lens: '20 mm f/2.0', Video: '4K30', Mic: 'Directional 3-capsule' },
		brandId: 'brand_sony',
		categoryId: 'cat_camera'
	},

	// Smartwatches
	{
		id: 'prod_watch-s10',
		name: 'Apple Watch Series 10 46mm',
		description: 'Thinner, faster, brighter — sleep apnea detection and water depth sensing.',
		priceCents: 42900,
		stock: 21,
		featured: true,
		specs: { Case: 'Aluminum 46 mm', Chip: 'S10 SiP', Health: 'ECG, SpO2, sleep apnea', Battery: 'Up to 18 h' },
		brandId: 'brand_apple',
		categoryId: 'cat_smartwatch'
	},
	{
		id: 'prod_watch-ultra2',
		name: 'Apple Watch Ultra 2',
		description: 'Rugged 49 mm titanium smartwatch for extreme adventures.',
		priceCents: 79900,
		stock: 5,
		specs: { Case: 'Titanium 49 mm', Display: '3000-nit LTPO OLED', Depth: '40 m dive rated', Battery: 'Up to 36 h' },
		brandId: 'brand_apple',
		categoryId: 'cat_smartwatch'
	},
	{
		id: 'prod_fenix8',
		name: 'Fenix 8 47mm AMOLED',
		description: 'Premium multisport GPS watch with maps, torch and speaker.',
		priceCents: 99900,
		stock: 9,
		specs: { Display: 'AMOLED touch', GPS: 'Multi-band SatIQ', Maps: 'Preloaded TopoActive', Battery: 'Up to 29 days' },
		brandId: 'brand_garmin',
		categoryId: 'cat_smartwatch'
	},
	{
		id: 'prod_vivosmart6',
		name: 'Vivosmart 6',
		description: 'Slim fitness band with weeks of battery and full health tracking.',
		priceCents: 17900,
		stock: 31,
		specs: { Display: 'AMOLED', Tracking: 'HR, SpO2, stress, sleep', Battery: 'Up to 11 days' },
		brandId: 'brand_garmin',
		categoryId: 'cat_smartwatch'
	},
	{
		id: 'prod_watch7-lte',
		name: 'Galaxy Watch7 LTE 44mm',
		description: 'Wear OS powerhouse with bioactive sensor and dual-frequency GPS.',
		priceCents: 34900,
		stock: 14,
		specs: { Chip: 'Exynos W1000', Display: 'Super AMOLED', GPS: 'Dual-frequency', Battery: '425 mAh' },
		brandId: 'brand_samsung',
		categoryId: 'cat_smartwatch'
	},

	// TVs
	{
		id: 'prod_qn90d65',
		name: 'Neo QLED 65" QN90D',
		description: 'Mini-LED brightness with anti-glare coating — superb for bright rooms.',
		priceCents: 189900,
		stock: 4,
		featured: true,
		specs: { Panel: 'Neo QLED Mini-LED', Resolution: '4K 120 Hz', HDR: 'HDR10+', Gaming: '4 HDMI 2.1' },
		brandId: 'brand_samsung',
		categoryId: 'cat_tv'
	},
	{
		id: 'prod_bravia7-55',
		name: 'Bravia 7 55" XR',
		description: 'Mini-LED Sony processing with Acoustic Multi-Audio and perfect Netflix mode.',
		priceCents: 169900,
		stock: 6,
		specs: { Panel: 'XR Backlight Master Drive', Processor: 'XR Processor', Audio: 'Acoustic Multi-Audio', Gaming: 'PS5 features' },
		brandId: 'brand_sony',
		categoryId: 'cat_tv'
	},
	{
		id: 'prod_crystal-uhd43',
		name: 'Crystal UHD 43" DU7200',
		description: 'Sharp, colorful 4K TV for bedrooms and kitchens on a budget.',
		priceCents: 27900,
		stock: 24,
		specs: { Panel: 'Crystal UHD', Resolution: '4K', Smart: 'Tizen OS', Refresh: '60 Hz' },
		brandId: 'brand_samsung',
		categoryId: 'cat_tv'
	},
	{
		id: 'prod_oled-b4-55',
		name: 'OLED evo B4 55"',
		description: 'Self-lit OLED perfection with α8 AI processor and webOS 24.',
		priceCents: 129900,
		stock: 7,
		specs: { Panel: 'OLED evo', Resolution: '4K 120 Hz', Dolby: 'Vision + Atmos', Gaming: '4× HDMI 2.1' },
		brandId: 'brand_lenovo',
		categoryId: 'cat_tv'
	}
];

function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

async function main() {
	if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
	console.log(`Seeding ${brands.length} brands, ${categories.length} categories, ${products.length} products…`);

	// --- Brands & categories: insert or update by fixed id -------------------
	await db
		.insert(brand)
		.values(brands)
		.onConflictDoUpdate({
			target: brand.id, // "conflict" = same primary key already exists
			set: { name: sql`excluded.name`, slug: sql`excluded.slug` } // excluded.* = the values we TRIED to insert
		});

	await db
		.insert(category)
		.values(categories)
		.onConflictDoUpdate({
			target: category.id,
			set: { name: sql`excluded.name`, slug: sql`excluded.slug` }
		});

	// --- Products -------------------------------------------------------------
	// The image URL is derived from the category slug, e.g. router → /products/router.svg
	await db
		.insert(product)
		.values(
			products.map((p) => ({
				id: p.id,
				name: p.name,
				slug: slugify(p.name),
				description: p.description,
				priceCents: p.priceCents,
				stock: p.stock,
				imageUrl: `/products/${categories.find((c) => c.id === p.categoryId)!.slug}.svg`,
				specs: p.specs,
				featured: p.featured ? 1 : 0,
				brandId: p.brandId,
				categoryId: p.categoryId
			}))
		)
		.onConflictDoUpdate({
			target: product.id,
			// Note: SQL column names (snake_case) in the excluded.* references!
			set: {
				name: sql`excluded.name`,
				slug: sql`excluded.slug`,
				description: sql`excluded.description`,
				priceCents: sql`excluded.price_cents`,
				stock: sql`excluded.stock`,
				imageUrl: sql`excluded.image_url`,
				specs: sql`excluded.specs`,
				featured: sql`excluded.featured`,
				brandId: sql`excluded.brand_id`,
				categoryId: sql`excluded.category_id`
			}
		});

	console.log('Seed complete ✔');
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
