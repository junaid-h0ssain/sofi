using Microsoft.EntityFrameworkCore;
using SoFi.Api.Auth;
using SoFi.Api.Data;
using SoFi.Api.Services;

// ============================================================================
// PROGRAM — composition root of the API
//
// Startup order (dev): load .env → build app → on first request-free boot we
// apply EF migrations + seed demo data → serve HTTP on :5080.
// ============================================================================

// ---------------------------------------------------------------------------
// Tiny .env loader: Bun auto-loads ../.env, dotnet does not. We parse the root
// .env ourselves so local development needs zero extra tooling. Variables that
// already exist in the environment are NOT overridden (compose/CI wins).
// ---------------------------------------------------------------------------
LoadDotEnv(Path.Combine(Directory.GetCurrentDirectory(), ".env"));
LoadDotEnv(Path.Combine(Directory.GetCurrentDirectory(), "../../.env"));
LoadDotEnv(Path.Combine(Directory.GetCurrentDirectory(), "../../../.env"));

static void LoadDotEnv(string path)
{
    if (!File.Exists(path)) return;
    foreach (var rawLine in File.ReadAllLines(path))
    {
        var line = rawLine.Trim();
        if (line.Length == 0 || line.StartsWith('#')) continue;

        var separator = line.IndexOf('=');
        if (separator <= 0) continue;

        var key = line[..separator].Trim();
        var value = line[(separator + 1)..].Trim().Trim('"');
        if (Environment.GetEnvironmentVariable(key) is null)
            Environment.SetEnvironmentVariable(key, value);
    }
}

var builder = WebApplication.CreateBuilder(args);

// ---------------------------------------------------------------------------
// Database: one Neon connection string, two contexts.
//   AppDbContext  → OWNS domain tables (EF migrations manage their schema)
//   AuthDbContext → READ-ONLY views over better-auth tables (never migrated)
// UseSnakeCaseNamingConvention() maps C# PascalCase → SQL snake_case so the
// schema stays identical to the TypeScript era.
// ---------------------------------------------------------------------------
// appsettings.json ships with an EMPTY Default value; treat that as "unset"
// so the environment variable (.env / compose) takes over.
var configured = builder.Configuration.GetConnectionString("Default");
if (string.IsNullOrWhiteSpace(configured))
    configured = Environment.GetEnvironmentVariable("DATABASE_URL");

var connectionString = ConnectionStringParser.FromUriOrRaw(
    configured
    ?? throw new InvalidOperationException(
        "No database connection: set ConnectionStrings:Default or DATABASE_URL"));

// One pooled data source shared by every context. EnableDynamicJson() opts in
// to serializing Dictionary<string,string> (Product.Specs) into jsonb columns.
var dataSourceBuilder = new Npgsql.NpgsqlDataSourceBuilder(connectionString);
dataSourceBuilder.EnableDynamicJson();
var dataSource = dataSourceBuilder.Build();

builder.Services.AddDbContextPool<AppDbContext>(options =>
    options.UseNpgsql(dataSource).UseSnakeCaseNamingConvention());

// Factory (not injected instance) because the auth handler creates short-lived
// contexts per request without touching the scoped AppDbContext lifetime.
builder.Services.AddDbContextPool<AuthDbContext>(options =>
    options.UseNpgsql(dataSource).UseSnakeCaseNamingConvention());
builder.Services.AddDbContextFactory<AuthDbContext>(options =>
    options.UseNpgsql(dataSource).UseSnakeCaseNamingConvention());

// ---------------------------------------------------------------------------
// Authentication: our custom BetterAuthHandler validates better-auth session
// tokens (Authorization: Bearer <token>) against the shared session table.
// After this, standard [Authorize] / [Authorize(Roles = "admin")] just work.
// ---------------------------------------------------------------------------
builder.Services.AddAuthentication(BetterAuthHandler.SchemeName)
    .AddScheme<Microsoft.AspNetCore.Authentication.AuthenticationSchemeOptions, BetterAuthHandler>(
        BetterAuthHandler.SchemeName, _ => { });

builder.Services.AddAuthorization();

// ---------------------------------------------------------------------------
// Business services (registered per request; they use the scoped AppDbContext)
// ---------------------------------------------------------------------------
builder.Services.AddScoped<CatalogService>();
builder.Services.AddScoped<CartService>();
builder.Services.AddScoped<CheckoutService>();
builder.Services.AddScoped<AdminService>();

// Controllers + OpenAPI/Swagger (Swagger only in Development).
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Serialize enums as lowercase strings ("paid", "shipped") so the
        // JSON contract matches what the TypeScript version returned.
        options.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter(
                System.Text.Json.JsonNamingPolicy.CamelCase));
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS: needed only for DIRECT browser calls (mobile app later, Swagger UI).
// The web app talks to us server-to-server, which ignores CORS entirely.
const string CorsPolicy = "web";
builder.Services.AddCors(options => options.AddPolicy(CorsPolicy, policy =>
{
    var origin = builder.Configuration["Cors:WebOrigin"]
                 ?? Environment.GetEnvironmentVariable("WEB_ORIGIN")
                 ?? "http://localhost:5173";
    policy.WithOrigins(origin).AllowAnyHeader().AllowAnyMethod();
}));

var app = builder.Build();

// ---------------------------------------------------------------------------
// Dev conveniences
// ---------------------------------------------------------------------------
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(CorsPolicy);

// Global error translation: services throw ApiError, clients get clean JSON:
//   { "message": "Insufficient stock for X (0 left)" }
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (ApiError error)
    {
        context.Response.StatusCode = error.StatusCode;
        await context.Response.WriteAsJsonAsync(new { message = error.Message });
    }
});

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ---------------------------------------------------------------------------
// CLI utility:  dotnet run -- promote-admin user@example.com
// Flips role='admin' on the better-auth user row (raw SQL on purpose: the
// AuthDbContext is read-only BY CONVENTION).
// ---------------------------------------------------------------------------
if (args.Length == 2 && args[0] == "promote-admin")
{
    await using var scope = app.Services.CreateAsyncScope();
    var authDb = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
    var email = args[1].ToLowerInvariant();

    var updated = await authDb.Database.ExecuteSqlInterpolatedAsync(
        $"UPDATE \"user\" SET role = 'admin' WHERE lower(email) = {email}");

    if (updated == 0)
    {
        Console.Error.WriteLine($"No user found with email {email}");
        return 1;
    }
    Console.WriteLine($"✔ {email} is now an admin");
    return 0;
}

// ---------------------------------------------------------------------------
// Apply migrations + seed demo data automatically in Development. In staging/
// production you'd run `dotnet ef database update` as a deployment step.
// ---------------------------------------------------------------------------
if (app.Environment.IsDevelopment())
{
    await using var scope = app.Services.CreateAsyncScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    await DbSeeder.SeedAsync(db, scope.ServiceProvider.GetRequiredService<ILogger<AppDbContext>>());
}

app.Run();
return 0;
