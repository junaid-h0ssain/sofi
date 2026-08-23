using System.Web;

namespace SoFi.Api.Data;

/// <summary>
/// ============================================================================
/// CONNECTION STRING PARSER
/// ============================================================================
///
 /// Neon hands out connection strings in URI form:
 ///
 ///   postgresql://user:pass@host:5432/db?sslmode=require&amp;channel_binding=require
 ///
 /// Npgsql 10's ADO.NET builder only accepts KEYWORD form:
 ///
 ///   Host=…;Port=…;Database=…;Username=…;Password=…;SSL Mode=Require
 ///
 /// This helper converts between them so the same DATABASE_URL env var works
 /// for Bun services (which accept URIs) and this .NET API.
public static class ConnectionStringParser
{
    public static string FromUriOrRaw(string raw)
    {
        if (!raw.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) &&
            !raw.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
        {
            return raw; // already keyword-style — use unchanged
        }

        var uri = new Uri(raw);

        var parts = new List<string>
        {
            $"Host={uri.Host}",
            $"Port={(uri.Port > 0 ? uri.Port : 5432)}",
            $"Database={uri.AbsolutePath.TrimStart('/')}",
            $"Username={HttpUtility.UrlDecode(uri.UserInfo.Split(':')[0])}"
        };

        // Password may be absent (e.g. trust auth) and may contain URL-encoded chars.
        var colonIndex = uri.UserInfo.IndexOf(':');
        if (colonIndex >= 0)
            parts.Add($"Password={HttpUtility.UrlDecode(uri.UserInfo[(colonIndex + 1)..])}");

        // Translate URI query parameters to their keyword equivalents.
        foreach (var param in HttpUtility.ParseQueryString(uri.Query).AllKeys)
        {
            if (param is null) continue;
            var value = HttpUtility.ParseQueryString(uri.Query)[param];

            switch (param.ToLowerInvariant())
            {
                case "sslmode":
                    parts.Add($"SSL Mode={value}");
                    break;
                case "channel_binding":
                    parts.Add($"Channel Binding={ToPascal(value)}");
                    break;
                default:
                    parts.Add($"{param}={value}"); // best effort passthrough
                    break;
            }
        }

        return string.Join(';', parts);
    }

    private static string ToPascal(string? value) =>
        string.IsNullOrEmpty(value) ? value! : char.ToUpperInvariant(value[0]) + value[1..];
}
