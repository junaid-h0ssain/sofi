using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoFi.Api.Contracts;
using SoFi.Api.Services;

namespace SoFi.Api.Controllers;

/// <summary>
/// Public catalog endpoints — no authentication required.
/// The web app's server code calls these on every page render.
/// </summary>
[ApiController]
[Route("api/v1/products")]
public class ProductsController(CatalogService catalog) : ControllerBase
{
    /// <summary>Paged + filtered product list (the /products page).</summary>
    [HttpGet]
    public async Task<ActionResult<PagedProductsDto>> List([FromQuery] ProductQuery query)
    {
        // Whitelist check happens in the service too; unknown sorts fall back to 'newest'.
        return await catalog.ListProductsAsync(query);
    }

    /// <summary>Homepage "Featured products" section.</summary>
    [HttpGet("featured")]
    public async Task<ActionResult<List<ProductDto>>> Featured([FromQuery] int limit = 8)
        => await catalog.GetFeaturedAsync(limit);

    /// <summary>Product detail page by URL slug.</summary>
    [HttpGet("{slug}")]
    public async Task<ActionResult<ProductDto>> GetBySlug(string slug)
    {
        var product = await catalog.GetBySlugAsync(slug);
        return product is null ? NotFound(new { message = "Product not found" }) : product;
    }

    /// <summary>"More in this category" suggestions for the detail page.</summary>
    [HttpGet("{slug}/related")]
    public async Task<ActionResult<List<ProductDto>>> Related(string slug, [FromQuery] int limit = 4)
    {
        var product = await catalog.GetBySlugAsync(slug);
        if (product is null)
            return NotFound(new { message = "Product not found" });

        return await catalog.GetRelatedAsync(product.Category.Id, product.Id, limit);
    }
}

/// <summary>Public brand list for the filter sidebar.</summary>
[ApiController]
[Route("api/v1/brands")]
public class BrandsController(CatalogService catalog) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<BrandDto>>> List() => await catalog.GetBrandsAsync();
}

/// <summary>Public category list with product counts.</summary>
[ApiController]
[Route("api/v1/categories")]
public class CategoriesController(CatalogService catalog) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<CategoryWithCountDto>>> List() =>
        await catalog.GetCategoriesWithCountsAsync();
}
