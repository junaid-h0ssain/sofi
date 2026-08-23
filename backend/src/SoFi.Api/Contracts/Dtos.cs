using Microsoft.AspNetCore.Mvc;
using System.Text.Json.Serialization;

namespace SoFi.Api.Contracts;

// ============================================================================
// DTOs — the JSON shapes the API exchanges.
//
// Domain entities never leave the API directly; DTOs decouple the wire format
// from the database schema so each can evolve independently.
// Money stays in integer CENTS end-to-end (see README "design decisions").
// ============================================================================

public record BrandDto(string Id, string Name, string Slug);

public record CategoryDto(string Id, string Name, string Slug);

public record CategoryWithCountDto(string Id, string Name, string Slug, int ProductCount);

public record ProductDto(
    string Id,
    string Name,
    string Slug,
    string Description,
    int PriceCents,
    int Stock,
    string? ImageUrl,
    Dictionary<string, string> Specs,
    bool Featured,
    DateTime CreatedAt,
    BrandDto Brand,
    CategoryDto Category);

/// <summary>Pagination envelope used by every listing endpoint.</summary>
public record PagedProductsDto(IReadOnlyList<ProductDto> Items, int Total, int Page, int Pages);

public record CartItemDto(string Id, int Quantity, ProductDto Product);

public record OrderItemDto(string Id, string ProductName, int UnitPriceCents, int Quantity, string? ImageUrl);

public record OrderSummaryDto(
    string Id,
    string Status,
    int TotalCents,
    int ShippingCents,
    string City,
    string Country,
    DateTime CreatedAt);

public record OrderDetailDto(
    string Id,
    string UserId,
    string Status,
    int TotalCents,
    int ShippingCents,
    string FullName,
    string Street,
    string City,
    string PostalCode,
    string Country,
    DateTime CreatedAt,
    IReadOnlyList<OrderItemDto> Items);

public record AdminProductRowDto(
    string Id,
    string Name,
    int PriceCents,
    int Stock,
    bool Featured,
    string BrandName,
    string CategoryName);

public record BrandWithCountDto(string Id, string Name, string Slug, int ProductCount);

// ---------------------------------------------------------------------------
// Request bodies (bound by model validation — see [ApiController] behaviour)
// ---------------------------------------------------------------------------

/// <summary>Catalog filters; repeated query params bind to the array properties
/// (?brands=apple&brands=sony). Prices are DOLLARS here and converted to cents
/// in the service, matching what the web UI sends.</summary>
public class ProductQuery
{
    public string? Q { get; set; }

    /// <summary>Bound from repeated ?brand=a&brand=b (URL contract of the web UI).</summary>
    [FromQuery(Name = "brand")]
    public string[] Brands { get; set; } = [];

    /// <summary>Bound from repeated ?category=a&category=b.</summary>
    [FromQuery(Name = "category")]
    public string[] Categories { get; set; } = [];

    /// <summary>'newest' | 'price-asc' | 'price-desc' | 'name' (validated).</summary>
    public string? Sort { get; set; }

    public decimal? Min { get; set; }
    public decimal? Max { get; set; }

    [JsonIgnore]
    public int Page { get; init; } = 1;
}

public record AddCartItemRequest(string ProductId, int Quantity);

public record UpdateCartItemRequest(int Quantity);

public record PlaceOrderRequest(string FullName, string Street, string City, string PostalCode, string Country);

public record SaveProductRequest(
    string Name,
    string Description,
    decimal Price,          // dollars; stored ×100 as cents
    int Stock,
    string BrandId,
    string CategoryId,
    string? ImageUrl,
    bool Featured,
    Dictionary<string, string> Specs);

public record CreateNameRequest(string Name); // brands & categories share this
