namespace SoFi.Api.Services;

/// <summary>
/// An exception carrying an HTTP status code. Thrown anywhere in the services;
/// the global middleware in Program converts it into a JSON error response.
/// This keeps controllers free of repetitive status-code plumbing.
/// </summary>
public class ApiError(int statusCode, string message) : Exception(message)
{
    public int StatusCode { get; } = statusCode;

    public static ApiError NotFound(string message = "Not found") => new(404, message);
    public static ApiError BadRequest(string message) => new(400, message);
    public static ApiError Conflict(string message) => new(409, message);
    public static ApiError Forbidden(string message = "Forbidden") => new(403, message);
}

/// <summary>
/// Shipping rules — ONE source of truth so cart previews and checkout always
/// agree. Mirrors src/lib/utils/pricing.ts in the web app.
/// </summary>
public static class Pricing
{
    public const int FreeShippingThresholdCents = 5000; // $50
    public const int FlatShippingCents = 499;           // $4.99

    public static int CalcShippingCents(int subtotalCents) =>
        subtotalCents == 0 || subtotalCents >= FreeShippingThresholdCents ? 0 : FlatShippingCents;
}
