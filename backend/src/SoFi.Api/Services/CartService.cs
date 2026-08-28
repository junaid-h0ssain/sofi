using Microsoft.EntityFrameworkCore;
using SoFi.Api.Contracts;
using SoFi.Api.Data;
using SoFi.Api.Domain;

namespace SoFi.Api.Services;

/// <summary>
/// ============================================================================
/// CART SERVICE — every cart read/write for one user
/// ============================================================================
///
 /// SECURITY PATTERN (important!): EVERY method takes userId and scopes its
 /// WHERE clauses with it. A user can never touch another user's rows because
 /// the queries simply don't match them. This is the same pattern the TS
 /// version used — authorization lives in the query, not in a check before it.
public class CartService(AppDbContext db)
{
    /// <summary>The cart with joined product+brand, oldest item first.</summary>
    public async Task<List<CartItemDto>> GetItemsAsync(string userId)
    {
        var items = await db.CartItems
            .AsNoTracking()
            .Include(i => i.Product).ThenInclude(p => p.Brand)
            .Include(i => i.Product).ThenInclude(p => p.Category)
            .Where(i => i.UserId == userId)
            .OrderBy(i => i.CreatedAt)
            .ToListAsync();

        return items.Select(i => new CartItemDto(
                i.Id, i.Quantity,
                new ProductDto(
                    i.Product.Id, i.Product.Name, i.Product.Slug, i.Product.Description,
                    i.Product.PriceCents, i.Product.Stock, i.Product.ImageUrl, i.Product.Specs,
                    i.Product.Featured == 1, i.Product.CreatedAt,
                    new BrandDto(i.Product.Brand.Id, i.Product.Brand.Name, i.Product.Brand.Slug),
                    new CategoryDto(i.Product.Category.Id, i.Product.Category.Name, i.Product.Category.Slug))))
            .ToList();
    }

    /// <summary>Subtotal = Σ price × quantity. Mirrors getCartTotal() in TS.</summary>
    public static int TotalCents(IEnumerable<CartItemDto> items) =>
        items.Sum(i => i.Product.PriceCents * i.Quantity);

    /// <summary>Add a product, or bump quantity when already in the cart.</summary>
    public async Task AddAsync(string userId, string productId, int quantity)
    {
        if (quantity is < 1 or > 99)
            throw ApiError.BadRequest("Quantity must be between 1 and 99");

        var productExists = await db.Products.AnyAsync(p => p.Id == productId);
        if (!productExists)
            throw ApiError.NotFound("Product not found");

        var existing = await db.CartItems
            .FirstOrDefaultAsync(i => i.UserId == userId && i.ProductId == productId);

        if (existing is not null)
        {
            existing.Quantity = Math.Min(existing.Quantity + quantity, 99); // sanity cap
        }
        else
        {
            db.CartItems.Add(new CartItem
            {
                Id = Guid.NewGuid().ToString(),
                UserId = userId,
                ProductId = productId,
                Quantity = quantity,
                CreatedAt = DateTime.UtcNow
            });
        }

        await db.SaveChangesAsync();
    }

    /// <summary>
    /// Set an exact quantity. The compound filter (itemId AND userId) means a
    /// row belonging to someone else matches NOTHING → we surface that as 404.
    /// </summary>
    public async Task SetQuantityAsync(string userId, string itemId, int quantity)
    {
        if (quantity is < 1 or > 99)
            throw ApiError.BadRequest("Quantity must be between 1 and 99");

        var updated = await db.CartItems
            .Where(i => i.Id == itemId && i.UserId == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(i => i.Quantity, quantity));

        if (updated == 0)
            throw ApiError.NotFound("Cart item not found");
    }

    public async Task RemoveAsync(string userId, string itemId)
    {
        await db.CartItems
            .Where(i => i.Id == itemId && i.UserId == userId)
            .ExecuteDeleteAsync();
    }

    public async Task ClearAsync(string userId)
    {
        await db.CartItems.Where(i => i.UserId == userId).ExecuteDeleteAsync();
    }
}
