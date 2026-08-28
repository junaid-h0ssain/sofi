using Microsoft.EntityFrameworkCore;

namespace SoFi.Api.Auth;

/// <summary>
/// READ-ONLY view of the better-auth `user` table.
///
/// The auth service (Hono + better-auth) OWNS this table — it's the only
/// writer. The API only reads ids/names/roles to authenticate requests and
/// display names. `ExcludeFromMigrations` keeps EF from ever creating or
/// altering the table while still letting us query it with full LINQ support.
/// </summary>
public class AuthUser
{
    public string Id { get; set; } = default!;
    public string Name { get; set; } = default!;
    public string Email { get; set; } = default!;

    /// <summary>Set by better-auth's admin plugin: null/'user' normally, 'admin' for admins.</summary>
    public string? Role { get; set; }
}

/// <summary>
/// READ-ONLY view of the better-auth `session` table.
///
 /// How cross-service authentication works:
 ///  1. User signs in → better-auth creates a session row with a random token
 ///     and sets a `better-auth.session_token` cookie in the browser.
 ///  2. The web app's server code forwards that token to THIS api as
 ///     `Authorization: Bearer &lt;token&gt;`.
 ///  3. Our BetterAuthHandler looks the token up HERE — same database, so
 ///     every service trusts the same sessions without extra network hops.
/// </summary>
public class AuthSession
{
    public string Id { get; set; } = default!;

    /// <summary>The opaque session token stored in the browser cookie.</summary>
    public string Token { get; set; } = default!;

    public DateTime ExpiresAt { get; set; }

    public string UserId { get; set; } = default!;

    public AuthUser User { get; set; } = default!;
}

/// <summary>
/// DbContext for the two better-auth tables we READ.
/// It never saves anything — there is deliberately no SaveChanges usage.
/// </summary>
public class AuthDbContext(DbContextOptions<AuthDbContext> options) : DbContext(options)
{
    public DbSet<AuthUser> Users => Set<AuthUser>();
    public DbSet<AuthSession> Sessions => Set<AuthSession>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ExcludeFromMigrations = "this table exists already, manage schema elsewhere".
        modelBuilder.Entity<AuthUser>(e =>
        {
            e.ToTable("user", t => t.ExcludeFromMigrations());
            e.HasKey(u => u.Id);
        });

        modelBuilder.Entity<AuthSession>(e =>
        {
            e.ToTable("session", t => t.ExcludeFromMigrations());
            e.HasKey(s => s.Id);
            e.HasOne(s => s.User).WithMany().HasForeignKey(s => s.UserId);
            e.HasIndex(s => s.Token);
        });
    }
}
