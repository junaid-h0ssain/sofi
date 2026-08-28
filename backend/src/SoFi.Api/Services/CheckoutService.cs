using Microsoft.EntityFrameworkCore;
using SoFi.Api.Contracts;
using SoFi.Api.Data;
using SoFi.Api.Domain;

namespace SoFi.Api.Services;

/// <summary>
/// ============================================================================
/// CHECKOUT SERVICE — places an order ATOMICALLY
/// ============================================================================
///
 /// THE INTERESTING PART: placing an order changes FOUR things —
 ///   1. insert the order row
 ///   2. insert one order_item per product
 ///   3. decrement each product's stock
 ///   4. empty the buyer's cart
 ///
 /// With EF Core, a SINGLE SaveChangesAsync() already wraps every tracked
 /// change in one database transaction: either everything is written or
 /// nothing is. We still open an explicit transaction below to demonstrate
 /// the general pattern (and because the old neon-http driver COULDN'T do
 /// this — see the db.batch() workaround in the TS version).
public class CheckoutService(AppDbContext db, CartService cartService)
{
    public async Task<string> PlaceOrderAsync(string userId, PlaceOrderRequest request)
    {
        // ---- 1. Validate the shipping form ---------------------------------
        var missing =
            string.IsNullOrWhiteSpace(request.FullName) ? "Full name" :
            string.IsNullOrWhiteSpace(request.Street) ? "Street" :
            string.IsNullOrWhiteSpace(request.City) ? "City" :
            string.IsNullOrWhiteSpace(request.PostalCode) ? "Postal code" :
            string.IsNullOrWhiteSpace(request.Country) ? "Country" : null;

        if (missing is not null)
            throw ApiError.BadRequest($"{missing} is required");

        // ---- 2. Re-read the cart on the SERVER -------------------------------
        // NEVER trust totals from the browser: recalculate from DB rows,
        // otherwise anyone could submit a forged $0 order.
        var items = await db.CartItems
            .Include(i => i.Product)
            .Where(i => i.UserId == userId)
            .OrderBy(i => i.CreatedAt)
            .ToListAsync();

        if (items.Count == 0)
            throw ApiError.BadRequest("Your cart is empty");

        // ---- 3. Stock check before writing anything --------------------------
        foreach (var item in items)
        {
            if (item.Product.Stock < item.Quantity)
                throw ApiError.BadRequest(
                    $"Insufficient stock for {item.Product.Name} ({item.Product.Stock} left)");
        }

        // ---- 4. Totals from server-side data ---------------------------------
        var subtotalCents = items.Sum(i => i.Product.PriceCents * i.Quantity);
        var shippingCents = Pricing.CalcShippingCents(subtotalCents);

        var orderId = Guid.NewGuid().ToString();

        await using var transaction = await db.Database.BeginTransactionAsync();
        try
        {
            var order = new Order
            {
                Id = orderId,
                UserId = userId,
                TotalCents = subtotalCents + shippingCents,
                ShippingCents = shippingCents,
                Status = OrderStatus.Paid, // mock checkout = instant payment
                FullName = request.FullName.Trim(),
                Street = request.Street.Trim(),
                City = request.City.Trim(),
                PostalCode = request.PostalCode.Trim(),
                Country = request.Country.Trim(),
                CreatedAt = DateTime.UtcNow
            };
            db.Orders.Add(order);

            // Snapshot name & price into line items so history survives
            // later product edits/deletions.
            foreach (var item in items)
            {
                db.OrderItems.Add(new OrderItem
                {
                    Id = Guid.NewGuid().ToString(),
                    OrderId = orderId,
                    ProductId = item.ProductId,
                    ProductName = item.Product.Name,
                    UnitPriceCents = item.Product.PriceCents,
                    Quantity = item.Quantity
                });

                // Decrement via tracked entity → UPDATE ... SET stock = stock - n.
                item.Product.Stock -= item.Quantity;
            }

            // Empty the buyer's cart.
            db.CartItems.RemoveRange(items);

            // ONE SaveChanges inside the transaction = all-or-nothing write.
            await db.SaveChangesAsync();
            await transaction.CommitAsync();

            return orderId;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
