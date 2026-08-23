using SoFi.Api.Data;
using SoFi.Api.Domain;

namespace SoFi.Api.Services;

/// <summary>
/// ============================================================================
/// SEEDER — demo data, ported 1:1 from the old TypeScript seed.ts
/// ============================================================================
///
 /// Idempotent thanks to two tricks carried over:
 ///   1. Fixed ids ("brand_apple", "prod_mbair-m3", …) instead of random UUIDs
 ///   2. Upsert semantics: existing rows are UPDATED, missing rows INSERTED
///
 /// Category slugs map to placeholder images: /products/{slug}.svg in the web app.
public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db, ILogger logger)
    {
        var brands = new[]
        {
            ("brand_apple",   "Apple",   "apple"),
            ("brand_samsung", "Samsung", "samsung"),
            ("brand_sony",    "Sony",    "sony"),
            ("brand_tplink",  "TP-Link", "tp-link"),
            ("brand_logitech","Logitech","logitech"),
            ("brand_lenovo",  "Lenovo",  "lenovo"),
            ("brand_canon",   "Canon",   "canon"),
            ("brand_garmin",  "Garmin",  "garmin")
        };

        // Slugs MUST match the SVG filenames in web/static/products/.
        var categories = new[]
        {
            ("cat_laptop",     "Laptops",      "laptop"),
            ("cat_phone",      "Phones",       "phone"),
            ("cat_tablet",     "Tablets",      "tablet"),
            ("cat_router",     "Routers",      "router"),
            ("cat_headphones", "Headphones",   "headphones"),
            ("cat_camera",     "Cameras",      "camera"),
            ("cat_smartwatch", "Smartwatches", "smartwatch"),
            ("cat_tv",         "TVs",          "tv")
        };

        await UpsertBrandsAndCategories(db, brands, categories);
        await UpsertProducts(db, logger);
        await db.SaveChangesAsync();
        logger.LogInformation("Seeding complete");
    }

    private static async Task UpsertBrandsAndCategories(
        AppDbContext db,
        (string Id, string Name, string Slug)[] brands,
        (string Id, string Name, string Slug)[] categories)
    {
        var now = DateTime.UtcNow;

        foreach (var b in brands)
        {
            var existing = await db.Brands.FindAsync(b.Id);
            if (existing is null)
                db.Brands.Add(new Brand { Id = b.Id, Name = b.Name, Slug = b.Slug, CreatedAt = now });
            else
                (existing.Name, existing.Slug) = (b.Name, b.Slug);
        }

        foreach (var c in categories)
        {
            var existing = await db.Categories.FindAsync(c.Id);
            if (existing is null)
                db.Categories.Add(new Category { Id = c.Id, Name = c.Name, Slug = c.Slug, CreatedAt = now });
            else
                (existing.Name, existing.Slug) = (c.Name, c.Slug);
        }

        await db.SaveChangesAsync();
    }

    private record SeedProduct(
        string Id, string Name, string Description, int PriceCents, int Stock,
        bool Featured, Dictionary<string, string> Specs, string BrandId, string CategoryId);

    private static readonly SeedProduct[] Products =
    [
        // ---------------- Laptops ----------------
        new("prod_mbair-m3", "MacBook Air 13\" M3",
            "Impossibly thin laptop with the M3 chip, all-day battery life and a Liquid Retina display.",
            109900, 14, true,
            new() { ["Chip"] = "Apple M3", ["RAM"] = "8 GB unified", ["Storage"] = "256 GB SSD", ["Display"] = "13.6\" Liquid Retina", ["Battery"] = "Up to 18 h" },
            "brand_apple", "cat_laptop"),
        new("prod_mbpro-m4", "MacBook Pro 16\" M4 Pro",
            "Pro performance for demanding workflows with a stunning mini-LED display.",
            249900, 5, true,
            new() { ["Chip"] = "Apple M4 Pro", ["RAM"] = "24 GB unified", ["Storage"] = "512 GB SSD", ["Display"] = "16.2\" XDR", ["Battery"] = "Up to 17 h" },
            "brand_apple", "cat_laptop"),
        new("prod_thinkpad-x1", "ThinkPad X1 Carbon Gen 12",
            "Legendary business ultrabook — carbon fiber chassis, best-in-class keyboard.",
            169900, 9, false,
            new() { ["CPU"] = "Intel Core Ultra 7", ["RAM"] = "32 GB LPDDR5x", ["Storage"] = "1 TB NVMe", ["Display"] = "14\" 2.8K OLED", ["Weight"] = "1.09 kg" },
            "brand_lenovo", "cat_laptop"),
        new("prod_ideapad-slim5", "IdeaPad Slim 5 14\"",
            "Everyday laptop with solid build quality and great battery life at a friendly price.",
            64900, 22, false,
            new() { ["CPU"] = "AMD Ryzen 7", ["RAM"] = "16 GB DDR5", ["Storage"] = "512 GB SSD", ["Display"] = "14\" WUXGA", ["Battery"] = "Up to 12 h" },
            "brand_lenovo", "cat_laptop"),
        new("prod_galaxybook4", "Galaxy Book4 Pro",
            "Sleek aluminum laptop with an AMOLED touchscreen and Galaxy ecosystem perks.",
            144900, 7, false,
            new() { ["CPU"] = "Intel Core Ultra 7", ["RAM"] = "16 GB", ["Storage"] = "512 GB SSD", ["Display"] = "14\" AMOLED touch", ["Battery"] = "Up to 15 h" },
            "brand_samsung", "cat_laptop"),

        // ---------------- Phones ----------------
        new("prod_iphone16pro", "iPhone 16 Pro 128 GB",
            "Titanium design, A18 Pro chip and a 48 MP Fusion camera system.",
            99900, 30, true,
            new() { ["Chip"] = "A18 Pro", ["Display"] = "6.3\" Super Retina XDR", ["Camera"] = "48 MP + 48 MP UW + 12 MP 5x tele", ["Battery"] = "Up to 23 h video" },
            "brand_apple", "cat_phone"),
        new("prod_iphonese4", "iPhone SE (4th gen)",
            "Compact flagship performance at an accessible price point.",
            42900, 40, false,
            new() { ["Chip"] = "A18", ["Display"] = "6.1\" LCD", ["Camera"] = "48 MP dual", ["Battery"] = "Up to 20 h video" },
            "brand_apple", "cat_phone"),
        new("prod_s24ultra", "Galaxy S24 Ultra 256 GB",
            "Built-in S Pen, titanium frame and Galaxy AI features throughout.",
            119900, 18, true,
            new() { ["Chip"] = "Snapdragon 8 Gen 3", ["Display"] = "6.8\" QHD+ AMOLED 120 Hz", ["Camera"] = "200 MP quad", ["SPen"] = "Included" },
            "brand_samsung", "cat_phone"),
        new("prod_galaxya55", "Galaxy A55 5G",
            "Mid-range favorite with a bright AMOLED panel and four years of OS upgrades.",
            39900, 35, false,
            new() { ["Chip"] = "Exynos 1480", ["Display"] = "6.6\" AMOLED 120 Hz", ["Camera"] = "50 MP OIS", ["Battery"] = "5000 mAh" },
            "brand_samsung", "cat_phone"),
        new("prod_xperia10vi", "Xperia 10 VI",
            "Sony essentials: clean Android, headphone jack and marathon battery life.",
            44900, 12, false,
            new() { ["Chip"] = "Snapdragon 6 Gen 1", ["Display"] = "6.1\" OLED", ["Audio"] = "3.5 mm jack", ["Battery"] = "5000 mAh" },
            "brand_sony", "cat_phone"),

        // ---------------- Tablets ----------------
        new("prod_ipadair-m2", "iPad Air 11\" M2",
            "The versatile tablet — powerful enough for work, perfect for everything else.",
            59900, 25, true,
            new() { ["Chip"] = "Apple M2", ["Display"] = "11\" Liquid Retina", ["Storage"] = "128 GB", ["Pencil"] = "Supports Apple Pencil Pro" },
            "brand_apple", "cat_tablet"),
        new("prod_tab-s9", "Galaxy Tab S9 FE+",
            "Big-screen entertainment tablet with included S Pen and IP68 rating.",
            47900, 15, false,
            new() { ["Display"] = "12.4\" LCD 90 Hz", ["Storage"] = "128 GB", ["Battery"] = "10090 mAh", ["Rating"] = "IP68" },
            "brand_samsung", "cat_tablet"),
        new("prod_tab-p12", "Tab Plus P12",
            "Affordable family tablet with JBL-tuned speakers.",
            27900, 28, false,
            new() { ["Display"] = "12.7\" 3K", ["Storage"] = "128 GB", ["Speakers"] = "Quad JBL-tuned", ["Battery"] = "10200 mAh" },
            "brand_lenovo", "cat_tablet"),

        // ---------------- Routers ----------------
        new("prod_deco-xe75", "Deco XE75 AXE5400 Mesh (3-pack)",
            "Tri-band Wi-Fi 6E mesh covering up to 650 m² with zero dead zones.",
            27900, 20, true,
            new() { ["WiFi"] = "Wi-Fi 6E AXE5400", ["Ports"] = "3× Gigabit per unit", ["Coverage"] = "Up to 650 m²", ["Clients"] = "200+" },
            "brand_tplink", "cat_router"),
        new("prod_archer-ax55", "Archer AX55 AX3000",
            "Fast dual-band Wi-Fi 6 router with full gigabit ports and OneMesh support.",
            9990, 45, false,
            new() { ["WiFi"] = "Wi-Fi 6 AX3000", ["Ports"] = "Gigabit WAN + 4× LAN", ["VPN"] = "OpenVPN/WireGuard", ["Coverage"] = "Medium homes" },
            "brand_tplink", "cat_router"),
        new("prod_archer-be800", "Archer BE800 BE19000",
            "Flagship Wi-Fi 7 router with 10G port and a touchscreen.",
            57900, 4, false,
            new() { ["WiFi"] = "Wi-Fi 7 BE19000", ["Ports"] = "10G WAN + 4× 2.5G LAN", ["Extras"] = "Touchscreen, USB 3.0", ["Bands"] = "Tri-band" },
            "brand_tplink", "cat_router"),
        new("prod_mesh-srs60", "Sony Mesh Wi-Fi SRS60",
            "Simple whole-home mesh tuned for stable streaming and gaming.",
            19900, 11, false,
            new() { ["WiFi"] = "Wi-Fi 6 AX3000", ["Coverage"] = "2-pack, 350 m²", ["App"] = "Full remote management" },
            "brand_sony", "cat_router"),

        // ---------------- Headphones ----------------
        new("prod_wh1000xm6", "WH-1000XM6 Wireless",
            "Industry-leading noise cancellation with exceptional sound and comfort.",
            44900, 26, true,
            new() { ["ANC"] = "Adaptive, 8 mics", ["Battery"] = "Up to 40 h", ["Codec"] = "LDAC / AAC", ["Weight"] = "250 g" },
            "brand_sony", "cat_headphones"),
        new("prod_wf1000xm5", "WF-1000XM5 Earbuds",
            "Flagship true wireless earbuds with rich sound and compact fit.",
            27900, 33, false,
            new() { ["ANC"] = "Integrated V2", ["Battery"] = "8 h + 16 h case", ["Codec"] = "LDAC", ["Rating"] = "IPX4" },
            "brand_sony", "cat_headphones"),
        new("prod_airpods-max", "AirPods Max USB-C",
            "Over-ear spatial audio with computational audio and premium build.",
            54900, 8, false,
            new() { ["Audio"] = "Spatial + head tracking", ["Chip"] = "H2", ["Battery"] = "Up to 20 h", ["Case"] = "Smart Case included" },
            "brand_apple", "cat_headphones"),
        new("prod_zone-vibe130", "Zone Vibe 130",
            "Lightweight wireless headset tuned for both calls and music.",
            12900, 50, false,
            new() { ["Mic"] = "Dual beamforming", ["Battery"] = "Up to 35 h", ["Connection"] = "Bluetooth LE / USB-C" },
            "brand_logitech", "cat_headphones"),
        new("prod_airpods-pro3", "AirPods Pro (3rd gen)",
            "Best-in-class ANC earbuds with adaptive audio and hearing aid features.",
            24900, 42, true,
            new() { ["Chip"] = "H3", ["ANC"] = "2× stronger than AirPods Pro 2", ["Battery"] = "6 h + 24 h case", ["Rating"] = "IP54" },
            "brand_apple", "cat_headphones"),

        // ---------------- Cameras ----------------
        new("prod_eos-r7", "EOS R7 Mirrorless",
            "APS-C flagship speed: 32.5 MP sensor, 30 fps bursts, IBIS.",
            149900, 6, false,
            new() { ["Sensor"] = "32.5 MP APS-C", ["Burst"] = "30 fps electronic", ["Stabilization"] = "IBIS 7 stops", ["Video"] = "4K60 oversampled" },
            "brand_canon", "cat_camera"),
        new("prod_eos-r50", "EOS R50 Kit RF-S 18-45",
            "Compact vlogging-ready mirrorless with dual pixel CMOS AF II.",
            79900, 13, false,
            new() { ["Sensor"] = "24.2 MP APS-C", ["Video"] = "4K30 uncropped", ["Screen"] = "Vari-angle touch", ["Weight"] = "375 g" },
            "brand_canon", "cat_camera"),
        new("prod_zv1f", "ZV-1F Vlogging Camera",
            "Pocket vlog camera with ultra-wide 20 mm lens and product showcase AF.",
            51900, 16, false,
            new() { ["Sensor"] = "20 MP 1\"", ["Lens"] = "20 mm f/2.0", ["Video"] = "4K30", ["Mic"] = "Directional 3-capsule" },
            "brand_sony", "cat_camera"),

        // ---------------- Smartwatches ----------------
        new("prod_watch-s10", "Apple Watch Series 10 46mm",
            "Thinner, faster, brighter — sleep apnea detection and water depth sensing.",
            42900, 21, true,
            new() { ["Case"] = "Aluminum 46 mm", ["Chip"] = "S10 SiP", ["Health"] = "ECG, SpO2, sleep apnea", ["Battery"] = "Up to 18 h" },
            "brand_apple", "cat_smartwatch"),
        new("prod_watch-ultra2", "Apple Watch Ultra 2",
            "Rugged 49 mm titanium smartwatch for extreme adventures.",
            79900, 5, false,
            new() { ["Case"] = "Titanium 49 mm", ["Display"] = "3000-nit LTPO OLED", ["Depth"] = "40 m dive rated", ["Battery"] = "Up to 36 h" },
            "brand_apple", "cat_smartwatch"),
        new("prod_fenix8", "Fenix 8 47mm AMOLED",
            "Premium multisport GPS watch with maps, torch and speaker.",
            99900, 9, false,
            new() { ["Display"] = "AMOLED touch", ["GPS"] = "Multi-band SatIQ", ["Maps"] = "Preloaded TopoActive", ["Battery"] = "Up to 29 days" },
            "brand_garmin", "cat_smartwatch"),
        new("prod_vivosmart6", "Vivosmart 6",
            "Slim fitness band with weeks of battery and full health tracking.",
            17900, 31, false,
            new() { ["Display"] = "AMOLED", ["Tracking"] = "HR, SpO2, stress, sleep", ["Battery"] = "Up to 11 days" },
            "brand_garmin", "cat_smartwatch"),
        new("prod_watch7-lte", "Galaxy Watch7 LTE 44mm",
            "Wear OS powerhouse with bioactive sensor and dual-frequency GPS.",
            34900, 14, false,
            new() { ["Chip"] = "Exynos W1000", ["Display"] = "Super AMOLED", ["GPS"] = "Dual-frequency", ["Battery"] = "425 mAh" },
            "brand_samsung", "cat_smartwatch"),

        // ---------------- TVs ----------------
        new("prod_qn90d65", "Neo QLED 65\" QN90D",
            "Mini-LED brightness with anti-glare coating — superb for bright rooms.",
            189900, 4, true,
            new() { ["Panel"] = "Neo QLED Mini-LED", ["Resolution"] = "4K 120 Hz", ["HDR"] = "HDR10+", ["Gaming"] = "4 HDMI 2.1" },
            "brand_samsung", "cat_tv"),
        new("prod_bravia7-55", "Bravia 7 55\" XR",
            "Mini-LED Sony processing with Acoustic Multi-Audio and perfect Netflix mode.",
            169900, 6, false,
            new() { ["Panel"] = "XR Backlight Master Drive", ["Processor"] = "XR Processor", ["Audio"] = "Acoustic Multi-Audio", ["Gaming"] = "PS5 features" },
            "brand_sony", "cat_tv"),
        new("prod_crystal-uhd43", "Crystal UHD 43\" DU7200",
            "Sharp, colorful 4K TV for bedrooms and kitchens on a budget.",
            27900, 24, false,
            new() { ["Panel"] = "Crystal UHD", ["Resolution"] = "4K", ["Smart"] = "Tizen OS", ["Refresh"] = "60 Hz" },
            "brand_samsung", "cat_tv"),
        new("prod_oled-b4-55", "OLED evo B4 55\"",
            "Self-lit OLED perfection with α8 AI processor and webOS 24.",
            129900, 7, false,
            new() { ["Panel"] = "OLED evo", ["Resolution"] = "4K 120 Hz", ["Dolby"] = "Vision + Atmos", ["Gaming"] = "4× HDMI 2.1" },
            "brand_lenovo", "cat_tv")
    ];

    private static async Task UpsertProducts(AppDbContext db, ILogger logger)
    {
        var now = DateTime.UtcNow;
        var inserted = 0;

        foreach (var p in Products)
        {
            // Existing products are left untouched (they may hold admin edits);
            // only missing ones are inserted. Re-running is always safe.
            if (await db.Products.FindAsync(p.Id) is not null)
                continue;

            db.Products.Add(new Product
            {
                Id = p.Id,
                Name = p.Name,
                Slug = Slugify(p.Name),
                Description = p.Description,
                PriceCents = p.PriceCents,
                Stock = p.Stock,
                ImageUrl = $"/products/{CategorySlug(p.CategoryId)}.svg",
                Specs = p.Specs,
                Featured = p.Featured ? 1 : 0,
                BrandId = p.BrandId,
                CategoryId = p.CategoryId,
                CreatedAt = now
            });
            inserted++;
        }

        logger.LogInformation("Seeder inserted {Count} products", inserted);
    }

    private static string CategorySlug(string categoryId) => categoryId switch
    {
        "cat_laptop" => "laptop",
        "cat_phone" => "phone",
        "cat_tablet" => "tablet",
        "cat_router" => "router",
        "cat_headphones" => "headphones",
        "cat_camera" => "camera",
        "cat_smartwatch" => "smartwatch",
        _ => "tv"
    };

    /// <summary>Same rules as the TS slugify util.</summary>
    public static string Slugify(string text)
    {
        var sb = new System.Text.StringBuilder();
        bool lastWasDash = true; // trims leading dashes
        foreach (var ch in text.ToLowerInvariant().Trim())
        {
            if (char.IsAsciiLetterOrDigit(ch))
            {
                sb.Append(ch);
                lastWasDash = false;
            }
            else if (!lastWasDash)
            {
                sb.Append('-');
                lastWasDash = true;
            }
        }
        return sb.ToString().TrimEnd('-');
    }
}
