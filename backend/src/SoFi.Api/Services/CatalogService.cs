using Microsoft.EntityFrameworkCore;
using SoFi.Api.Contracts;
using SoFi.Api.Data;
using SoFi.Api.Domain;

namespace SoFi.Api.Services;

/// <summary>
/// ============================================================================
/// CATALOG SERVICE — every public read for brands / categories / products.
/// Port of src/lib/server/catalog.ts from the TypeScript version.
/// ============================================================================
/// </summary>
public class CatalogService(AppDbContext db)
{
    public const int PerPage = 12;

    private static readonly HashSet<string> ValidSorts =
        new(StringComparer.OrdinalIgnoreCase) { "newest", "price-asc", "price-desc", "name" };

    /// <summary>
    /// One page of products plus the total match count. Filters arrive as
    /// slugs/values from the URL; everything is translated into one query so
    /// filtering, sorting and paging happen inside PostgreSQL.
    /// </summary>
    public async Task<PagedProductsDto> ListProductsAsync(ProductQuery query)
    {
        var page = Math.Max(1, query.Page);
        var sort = ValidSorts.Contains(query.Sort ?? "") ? query.Sort! : "newest";

        // Start from products with brand & category eagerly loaded (JOINs).
        var products = db.Products
            .Include(p => p.Brand)
            .Include(p => p.Category)
            .AsNoTracking()
            .AsQueryable();

        // ---- filters (each optional, applied only when present) -------------
        if (!string.IsNullOrWhiteSpace(query.Q))
        {
            var term = $"%{query.Q.Trim()}%";
            // ILike = case-insensitive LIKE (PostgreSQL extension).
            products = products.Where(p =>
                EF.Functions.ILike(p.Name, term) || EF.Functions.ILike(p.Description, term));
        }

        if (query.Brands.Length > 0)
            products = products.Where(p => query.Brands.Contains(p.Brand.Slug));

        if (query.Categories.Length > 0)
            products = products.Where(p => query.Categories.Contains(p.Category.Slug));

        if (query.Min is { } minDollars)
            products = products.Where(p => p.PriceCents >= ToCents(minDollars));

        if (query.Max is { } maxDollars)
            products = products.Where(p => p.PriceCents <= ToCents(maxDollars));

        // ---- sorting --------------------------------------------------------
        products = sort switch
        {
            "price-asc"  => products.OrderBy(p => p.PriceCents),
            "price-desc" => products.OrderByDescending(p => p.PriceCents),
            "name"       => products.OrderBy(p => p.Name),
            _            => products.OrderByDescending(p => p.CreatedAt) // 'newest'
        };

        // ---- count + page ----------------------------------------------------
        var total = await products.CountAsync();

        var items = await products
            .Skip((page - 1) * PerPage)
            .Take(PerPage)
            .ToListAsync(); // SQL executes HERE (deferred execution until materialized)

        return new PagedProductsDto(
            Items: items.Select(MapToDto).ToList(),
            Total: total,
            Page: page,
            Pages: Math.Max(1, (int)Math.Ceiling(total / (double)PerPage)));
    }

    public async Task<ProductDto?> GetBySlugAsync(string slug)
    {
        var product = await db.Products
            .Include(p => p.Brand)
            .Include(p => p.Category)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Slug == slug);

        return product is null ? null : MapToDto(product);
    }

    public async Task<List<ProductDto>> GetRelatedAsync(string categoryId, string excludeProductId, int limit = 4)
    {
        var products = await db.Products
            .Include(p => p.Brand)
            .Include(p => p.Category)
            .AsNoTracking()
            .Where(p => p.CategoryId == categoryId && p.Id != excludeProductId)
            .OrderByDescending(p => p.Featured)
            .ThenByDescending(p => p.CreatedAt)
            .Take(limit)
            .ToListAsync();

        return products.Select(MapToDto).ToList();
    }

    public async Task<List<ProductDto>> GetFeaturedAsync(int limit = 8)
    {
        var products = await db.Products
            .Include(p => p.Brand)
            .Include(p => p.Category)
            .AsNoTracking()
            .Where(p => p.Featured == 1)
            .OrderByDescending(p => p.CreatedAt)
            .Take(limit)
            .ToListAsync();

        return products.Select(MapToDto).ToList();
    }

    public async Task<List<BrandDto>> GetBrandsAsync() =>
        await db.Brands
            .AsNoTracking()
            .OrderBy(b => b.Name)
            .Select(b => new BrandDto(b.Id, b.Name, b.Slug))
            .ToListAsync();

    /// <summary>"Laptops (5)" — LEFT JOIN + GROUP BY keeps empty categories visible.</summary>
    public async Task<List<CategoryWithCountDto>> GetCategoriesWithCountsAsync() =>
        await db.Categories
            .AsNoTracking()
            // OrderBy must come BEFORE the projection, otherwise EF cannot
            // translate the ordering through the DTO constructor.
            .OrderBy(c => c.Name)
            .Select(c => new CategoryWithCountDto(
                c.Id, c.Name, c.Slug,
                c.Products.Count)) // translated to a COUNT subquery/join by EF
            .ToListAsync();

    // ---------------------------------------------------------------- helpers

    private static int ToCents(decimal dollars) => (int)Math.Round(dollars * 100);

    private static ProductDto MapToDto(Product p) => new(
        p.Id, p.Name, p.Slug, p.Description, p.PriceCents, p.Stock,
        p.ImageUrl, p.Specs, p.Featured == 1, p.CreatedAt,
        new BrandDto(p.Brand.Id, p.Brand.Name, p.Brand.Slug),
        new CategoryDto(p.Category.Id, p.Category.Name, p.Category.Slug));
}
