using Microsoft.EntityFrameworkCore;
using SoFi.Api.Contracts;
using SoFi.Api.Data;
using SoFi.Api.Domain;

namespace SoFi.Api.Services;

/// <summary>
/// ============================================================================
/// ADMIN SERVICE — CRUD for products, brands and categories
/// ============================================================================
///
 /// Two classic SQL lessons live here:
 ///  - Unique indexes (slug!) → DbUpdateException on duplicates → we answer 409 Conflict
 ///  - FK RESTRICT (product referenced by an old order) → same exception type,
 ///    so we inspect or translate into friendly messages.
public class AdminService(AppDbContext db)
{
    // ---------------------------------------------------------------- products

    /// <summary>Dashboard aggregates: product count, paid orders, revenue.</summary>
    public async Task<(int ProductCount, int OrderCount, int RevenueCents)> GetStatsAsync()
    {
        var productCount = await db.Products.CountAsync();
        var orderCount = await db.Orders.CountAsync(o => o.Status == OrderStatus.Paid);
        var revenueCents = await db.OrderItems.SumAsync(i => i.UnitPriceCents * i.Quantity);

        return (productCount, orderCount, revenueCents);
    }

    /// <summary>Full product (with brand/category) for the admin edit form.</summary>
    public async Task<Contracts.ProductDto?> GetProductAsync(string id)
    {
        var p = await db.Products
            .AsNoTracking()
            .Include(x => x.Brand)
            .Include(x => x.Category)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (p is null) return null;

        return new Contracts.ProductDto(
            p.Id, p.Name, p.Slug, p.Description, p.PriceCents, p.Stock,
            p.ImageUrl, p.Specs, p.Featured == 1, p.CreatedAt,
            new Contracts.BrandDto(p.Brand.Id, p.Brand.Name, p.Brand.Slug),
            new Contracts.CategoryDto(p.Category.Id, p.Category.Name, p.Category.Slug));
    }

    public async Task<List<AdminProductRowDto>> ListProductsAsync()
    {
        var rows = await db.Products
            .AsNoTracking()
            .Include(p => p.Brand)
            .Include(p => p.Category)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new AdminProductRowDto(
                p.Id, p.Name, p.PriceCents, p.Stock, p.Featured == 1,
                p.Brand.Name, p.Category.Name))
            .ToListAsync();

        return rows;
    }

    public async Task<string> CreateProductAsync(SaveProductRequest request)
    {
        var (validated, slug) = Validate(request);

        var product = new Product
        {
            Id = Guid.NewGuid().ToString(),
            Name = validated.Name.Trim(),
            Slug = slug,
            Description = validated.Description?.Trim() ?? "",
            PriceCents = ToCents(validated.Price),
            Stock = validated.Stock,
            BrandId = validated.BrandId,
            CategoryId = validated.CategoryId,
            ImageUrl = validated.ImageUrl,
            Featured = validated.Featured ? 1 : 0,
            Specs = validated.Specs ?? new Dictionary<string, string>(),
            CreatedAt = DateTime.UtcNow
        };

        try
        {
            db.Products.Add(product);
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException) // unique index on slug rejected us
        {
            throw ApiError.Conflict("Could not create product (slug may already exist)");
        }

        return product.Id;
    }

    public async Task UpdateProductAsync(string id, SaveProductRequest request)
    {
        var product = await db.Products.FindAsync(id)
                      ?? throw ApiError.NotFound("Product not found");

        var (validated, slug) = Validate(request);

        product.Name = validated.Name.Trim();
        product.Slug = slug; // always derived from the name
        product.Description = validated.Description?.Trim() ?? "";
        product.PriceCents = ToCents(validated.Price);
        product.Stock = validated.Stock;
        product.BrandId = validated.BrandId;
        product.CategoryId = validated.CategoryId;
        product.ImageUrl = validated.ImageUrl;
        product.Featured = validated.Featured ? 1 : 0;
        product.Specs = validated.Specs ?? new Dictionary<string, string>();

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            throw ApiError.Conflict("Could not update product (slug may already exist)");
        }
    }

    public async Task DeleteProductAsync(string id)
    {
        var product = await db.Products.FindAsync(id)
                      ?? throw ApiError.NotFound("Product not found");

        try
        {
            db.Products.Remove(product);
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException) // order_item FK is ON DELETE RESTRICT
        {
            throw ApiError.Conflict("Cannot delete: this product is referenced by existing orders.");
        }
    }

    // ----------------------------------------------------------------- brands

    public async Task<List<BrandWithCountDto>> ListBrandsAsync() =>
        await db.Brands
            .AsNoTracking()
            .OrderBy(b => b.Name)
            .Select(b => new BrandWithCountDto(b.Id, b.Name, b.Slug, b.Products.Count))
            .ToListAsync();

    public async Task CreateBrandAsync(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw ApiError.BadRequest("Name is required");

        db.Brands.Add(new Brand
        {
            Id = Guid.NewGuid().ToString(),
            Name = name.Trim(),
            Slug = DbSeeder.Slugify(name),
            CreatedAt = DateTime.UtcNow
        });

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            throw ApiError.Conflict("A brand with this name already exists");
        }
    }

    public async Task DeleteBrandAsync(string id)
    {
        var brand = await db.Brands.FindAsync(id)
                    ?? throw ApiError.NotFound("Brand not found");

        try
        {
            db.Brands.Remove(brand);
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            throw ApiError.Conflict("Cannot delete a brand that still has products");
        }
    }

    // ------------------------------------------------------------- categories

    public async Task<List<CategoryWithCountDto>> ListCategoriesAsync() =>
        await db.Categories
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => new CategoryWithCountDto(c.Id, c.Name, c.Slug, c.Products.Count))
            .ToListAsync();

    public async Task CreateCategoryAsync(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw ApiError.BadRequest("Name is required");

        db.Categories.Add(new Category
        {
            Id = Guid.NewGuid().ToString(),
            Name = name.Trim(),
            Slug = DbSeeder.Slugify(name),
            CreatedAt = DateTime.UtcNow
        });

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            throw ApiError.Conflict("A category with this name already exists");
        }
    }

    public async Task DeleteCategoryAsync(string id)
    {
        var category = await db.Categories.FindAsync(id)
                       ?? throw ApiError.NotFound("Category not found");

        try
        {
            db.Categories.Remove(category);
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            throw ApiError.Conflict("Cannot delete a category that still has products");
        }
    }

    // ---------------------------------------------------------------- helpers

    private static (SaveProductRequest Request, string Slug) Validate(SaveProductRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw ApiError.BadRequest("Name is required");
        if (request.Price < 0)
            throw ApiError.BadRequest("A valid price is required");
        if (request.Stock < 0)
            throw ApiError.BadRequest("Stock must be a non-negative integer");

        return (request, DbSeeder.Slugify(request.Name));
    }

    private static int ToCents(decimal dollars) => (int)Math.Round(dollars * 100);
}
