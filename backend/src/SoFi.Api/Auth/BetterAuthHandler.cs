using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace SoFi.Api.Auth;

/// <summary>
/// ============================================================================
/// BETTER-AUTH SESSION HANDLER — how this API authenticates requests
/// ============================================================================
///
 /// better-auth (running in the separate auth service) stores sessions in the
 /// SHARED Neon database. Every signed-in browser holds a cookie containing a
 /// random session token. The SvelteKit BFF forwards that token here as:
 ///
 ///     Authorization: Bearer &lt;better-auth-session-token&gt;
 ///
 /// This handler validates it with ONE indexed database query against the
 /// shared `session` table and builds the standard ASP.NET ClaimsPrincipal —
 /// after that, plain [Authorize] / [Authorize(Roles = "admin")] attributes
 /// work everywhere. A future mobile app can send the exact same header
 /// (better-auth's bearer plugin hands out these same tokens), which is why
 /// we don't need JWTs at all.
///
 /// Inheritance from AuthenticationHandler plugs us into ASP.NET Core's
 /// normal authentication pipeline (UseAuthentication in Program.cs).
/// </summary>
public class BetterAuthHandler(
    IDbContextFactory<AuthDbContext> authDbFactory,
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder
) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "BetterAuth";

    private const string BearerPrefix = "Bearer ";

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // 1. Extract the token from "Authorization: Bearer <token>".
        string? authorization = Request.Headers.Authorization.ToString();
        if (string.IsNullOrEmpty(authorization))
            return AuthenticateResult.NoResult(); // anonymous request — endpoints decide via [Authorize]

        if (!authorization.StartsWith(BearerPrefix, StringComparison.OrdinalIgnoreCase))
            return AuthenticateResult.NoResult();

        string token = authorization[BearerPrefix.Length..].Trim();
        if (token.Length == 0)
            return AuthenticateResult.NoResult();

        // 2. Look the token up in the SHARED session table (owned by auth svc).
        await using var db = await authDbFactory.CreateDbContextAsync();

        var session = await db.Sessions
            .AsNoTracking()
            .Include(s => s.User)
            .Where(s => s.Token == token && s.ExpiresAt > DateTime.UtcNow)
            .Select(s => new { s.Id, User = new { s.User.Id, s.User.Name, s.User.Email, s.User.Role } })
            .FirstOrDefaultAsync();

        // 3. Unknown/expired token → explicit failure ⇒ [Authorize] returns 401.
        if (session is null)
            return AuthenticateResult.Fail("Invalid or expired session token");

        // 4. Build the principal: claims other code can rely on.
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, session.User.Id),
            new(ClaimTypes.Name, session.User.Name),
            new(ClaimTypes.Email, session.User.Email)
        };

        // better-auth admin plugin: role is null/'user' for mortals, 'admin' for admins.
        claims.Add(new Claim(ClaimTypes.Role, session.User.Role ?? "user"));

        var identity = new ClaimsIdentity(claims, authenticationType: SchemeName);
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), SchemeName);

        return AuthenticateResult.Success(ticket);
    }
}
