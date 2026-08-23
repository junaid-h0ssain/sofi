using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoFi.Api.Contracts;
using SoFi.Api.Services;

namespace SoFi.Api.Controllers;

// ============================================================================
// ADMIN ENDPOINTS — full CRUD, restricted to users with role = 'admin'.
//
// [Authorize(Roles = "admin")] works because BetterAuthHandler copies the
// role column (set by better-auth's admin plugin) into a Role claim.
// Non-admins receive 403 before any controller code runs.
// ============================================================================

[ApiController]
[Authorize(Roles = "admin")]
[Route("api/v1/admin/products")]
public class AdminProductsController(AdminService admin) : ControllerBase
{
    [HttpGet("stats")]
    public async Task<ActionResult<object>> Stats()
    {
        var (productCount, orderCount, revenueCents) = await admin.GetStatsAsync();
        return Ok(new { productCount, orderCount, revenueCents });
    }

    [HttpGet]
    public async Task<ActionResult<List<AdminProductRowDto>>> List() =>
        await admin.ListProductsAsync();

    /// <summary>Full product for the admin edit form.</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<SoFi.Api.Contracts.ProductDto>> Get(string id)
    {
        var product = await admin.GetProductAsync(id);
        return product is null
            ? NotFound(new { message = "Product not found" })
            : product;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveProductRequest request)
    {
        var id = await admin.CreateProductAsync(request);
        return Created($"/api/v1/products/{id}", new { id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] SaveProductRequest request)
    {
        await admin.UpdateProductAsync(id, request);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        await admin.DeleteProductAsync(id);
        return NoContent();
    }
}

[ApiController]
[Authorize(Roles = "admin")]
[Route("api/v1/admin/brands")]
public class AdminBrandsController(AdminService admin) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<BrandWithCountDto>>> List() =>
        await admin.ListBrandsAsync();

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateNameRequest request)
    {
        await admin.CreateBrandAsync(request.Name);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        await admin.DeleteBrandAsync(id);
        return NoContent();
    }
}

[ApiController]
[Authorize(Roles = "admin")]
[Route("api/v1/admin/categories")]
public class AdminCategoriesController(AdminService admin) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<CategoryWithCountDto>>> List() =>
        await admin.ListCategoriesAsync();

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateNameRequest request)
    {
        await admin.CreateCategoryAsync(request.Name);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        await admin.DeleteCategoryAsync(id);
        return NoContent();
    }
}
