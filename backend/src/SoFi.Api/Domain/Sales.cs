namespace SoFi.Api.Domain;

/// <summary>
/// One row per product inside one user's cart.
/// A unique index on (UserId, ProductId) guarantees a product appears at most
/// once per cart — adding again bumps Quantity instead.
/// </summary>
public class CartItem
{
    public string Id { get; set; } = default!;

    /// <summary>
    /// References the better-auth "user" table OWNED BY THE AUTH SERVICE.
    /// We store the id and create the FK constraint, but never write users —
    /// see Auth.AuthUser for the read-only view of that table.
    /// </summary>
    public string UserId { get; set; } = default!;

    public string ProductId { get; set; } = default!;

    public int Quantity { get; set; }

    public DateTime CreatedAt { get; set; }

    public Product Product { get; set; } = default!;
}

/// <summary>Lifecycle of an order. Mock checkout always starts at Paid.</summary>
public enum OrderStatus
{
    Paid = 0,
    Shipped = 1,
    Delivered = 2,
    Cancelled = 3
}

/// <summary>
/// A completed purchase: who bought it, where it ships, totals AT THAT MOMENT.
/// </summary>
public class Order
{
    public string Id { get; set; } = default!;
    public string UserId { get; set; } = default!;

    public int TotalCents { get; set; }

    /// <summary>Shipping cost at purchase time (stored so history never changes).</summary>
    public int ShippingCents { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.Paid;

    // Shipping address snapshot
    public string FullName { get; set; } = default!;
    public string Street { get; set; } = default!;
    public string City { get; set; } = default!;
    public string PostalCode { get; set; } = default!;
    public string Country { get; set; } = default!;

    public DateTime CreatedAt { get; set; }

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}

/// <summary>
/// One line of an order. Name &amp; price are COPIED here (denormalization)
/// so old orders stay correct even after products are renamed/re-priced/deleted.
/// </summary>
public class OrderItem
{
    public string Id { get; set; } = default!;
    public string OrderId { get; set; } = default!;

    public string ProductId { get; set; } = default!;

    public string ProductName { get; set; } = default!;
    public int UnitPriceCents { get; set; }
    public int Quantity { get; set; }
}
