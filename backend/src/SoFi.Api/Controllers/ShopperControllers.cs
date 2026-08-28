using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SoFi.Api.Contracts;
using SoFi.Api.Data;
using SoFi.Api.Services;

namespace SoFi.Api.Controllers;

// ============================================================================
// SHOPPER ENDPOINTS — cart, checkout, orders.
//
// [Authorize] + the BetterAuth scheme: requests must carry a valid session
// token ("Authorization: Bearer <better-auth-session-token>"). The user's id
// is read from their claims — NEVER from a request parameter — so shoppers
// can only ever act on their own data.
// ============================================================================

[ApiController]
[Authorize]
[Route("api/v1/cart")]
public class CartController(CartService cart) : ControllerBase
{
    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult<List<CartItemDto>>> Get() =>
        await cart.GetItemsAsync(UserId);

    [HttpPost("items")]
    public async Task<IActionResult> AddItem([FromBody] AddCartItemRequest request)
    {
        await cart.AddAsync(UserId, request.ProductId, request.Quantity);
        return NoContent();
    }

    [HttpPut("items/{itemId}")]
    public async Task<IActionResult> SetQuantity(string itemId, [FromBody] UpdateCartItemRequest request)
    {
        await cart.SetQuantityAsync(UserId, itemId, request.Quantity);
        return NoContent();
    }

    [HttpDelete("items/{itemId}")]
    public async Task<IActionResult> RemoveItem(string itemId)
    {
        await cart.RemoveAsync(UserId, itemId);
        return NoContent();
    }

    [HttpDelete]
    public async Task<IActionResult> Clear()
    {
        await cart.ClearAsync(UserId);
        return NoContent();
    }
}

[ApiController]
[Authorize]
[Route("api/v1/checkout")]
public class CheckoutController(CheckoutService checkout) : ControllerBase
{
    /// <summary>
    /// Places an order atomically and returns its id.
    /// Mock payment — a real integration would create a Stripe PaymentIntent here.
    /// </summary>
    [HttpPost("orders")]
    public async Task<IActionResult> PlaceOrder([FromBody] PlaceOrderRequest request)
    {
        var orderId = await checkout.PlaceOrderAsync(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!, request);

        // 201 Created + Location header pointing at the new resource (REST style).
        return CreatedAtAction(
            nameof(OrdersController.GetById),
            "Orders",
            new { id = orderId },
            new { orderId });
    }
}

[ApiController]
[Authorize]
[Route("api/v1/orders")]
public class OrdersController(AppDbContext db) : ControllerBase
{
    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    private bool IsAdmin => User.IsInRole("admin");

    /// <summary>The signed-in user's order history (admins see their own here too).</summary>
    [HttpGet]
    public async Task<ActionResult<List<OrderSummaryDto>>> List()
    {
        var orders = await db.Orders
            .AsNoTracking()
            .Where(o => o.UserId == UserId)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new OrderSummaryDto(
                o.Id,
                o.Status.ToString().ToLowerInvariant(), // "paid" — matches old JSON contract
                o.TotalCents,
                o.ShippingCents,
                o.City,
                o.Country,
                o.CreatedAt))
            .ToListAsync();

        return orders;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OrderDetailDto>> GetById(string id)
    {
        var order = await db.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order is null)
            return NotFound(new { message = "Order not found" });

        // Ownership check — the id in the URL is untrusted input!
        // Admins may inspect any order (e.g. for support requests).
        if (order.UserId != UserId && !IsAdmin)
            return StatusCode(403, new { message = "Not your order" });

        // Join CURRENT product images; names/prices come from the snapshot.
        var productIds = order.Items.Select(i => i.ProductId).ToList();
        var images = await db.Products
            .AsNoTracking()
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, p => p.ImageUrl);

        return new OrderDetailDto(
            order.Id,
            order.UserId,
            order.Status.ToString().ToLowerInvariant(),
            order.TotalCents,
            order.ShippingCents,
            order.FullName,
            order.Street,
            order.City,
            order.PostalCode,
            order.Country,
            order.CreatedAt,
            order.Items
                .Select(i => new OrderItemDto(
                    i.Id, i.ProductName, i.UnitPriceCents, i.Quantity,
                    images.GetValueOrDefault(i.ProductId)))
                .ToList());
    }
}
