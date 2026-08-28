using Microsoft.EntityFrameworkCore;
using SoFi.Api.Auth;
using SoFi.Api.Domain;

namespace SoFi.Api.Data;

/// <summary>
/// The main EF Core database context — OWNS all domain tables
/// (brand, category, product, cart_item, "order", order_item).
///
/// The better-auth tables (user/session) are intentionally NOT managed here;
/// they belong to the auth service. We still MAP `AuthUser` read-only
/// (ExcludeFromMigrations) purely so we can declare real FOREIGN KEYS to it.
///
 /// Snake_case SQL names come from UseSnakeCaseNamingConvention() in Program.cs,
 /// matching the names the TypeScript version used.
/// </summary>
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ---------- better-auth tables: mapped but never migrated ----------
        // Exists already (auth service owns it); referenced by our FKs below.
        modelBuilder.Entity<AuthUser>(e =>
        {
            e.ToTable("user", t => t.ExcludeFromMigrations());
            e.HasKey(u => u.Id);
        });

        // ---------- Brand ----------
        modelBuilder.Entity<Brand>(e =>
        {
            e.ToTable("brand"); // same name the TypeScript version used
            e.HasIndex(b => b.Slug).IsUnique();
        });

        // ---------- Category ----------
        modelBuilder.Entity<Category>(e =>
        {
            e.ToTable("category");
            e.HasIndex(c => c.Slug).IsUnique();
        });

        // ---------- Product ----------
        modelBuilder.Entity<Product>(e =>
        {
            e.ToTable("product");
            e.HasIndex(p => p.Slug).IsUnique();
            e.HasIndex(p => p.BrandId);
            e.HasIndex(p => p.CategoryId);
            e.HasIndex(p => p.PriceCents);

            // Dictionary<string,string> → jsonb is automatic with Npgsql;
            // pinning the column type explicitly for clarity.
            e.Property(p => p.Specs).HasColumnType("jsonb");

            // Restrict = cannot delete a brand/category that still has products.
            e.HasOne(p => p.Brand)
                .WithMany(b => b.Products)
                .HasForeignKey(p => p.BrandId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(p => p.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ---------- CartItem ----------
        modelBuilder.Entity<CartItem>(e =>
        {
            e.ToTable("cart_item");
            e.HasIndex(c => new { c.UserId, c.ProductId }).IsUnique();

            e.HasOne(c => c.Product)
                .WithMany()
                .HasForeignKey(c => c.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            // FK into the auth-owned "user" table; cascade = delete user ⇒ cart gone.
            e.HasOne<AuthUser>()
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ---------- Order / OrderItem ----------
        modelBuilder.Entity<Order>(e =>
        {
            e.ToTable("order"); // "order" is a reserved word — EF/Npgsql quote it
            e.Property(o => o.Status).HasConversion<string>(); // store enum as text ('Paid','Shipped'…) like the pgEnum did
            e.HasIndex(o => o.UserId);

            e.HasOne<AuthUser>()
                .WithMany()
                .HasForeignKey(o => o.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OrderItem>(e =>
        {
            e.ToTable("order_item");
            e.HasIndex(oi => oi.OrderId);

            // No Order navigation needed on items; the FK + the collection
            // side (Order.Items) fully describe the relationship.
            e.HasOne<Order>()
                .WithMany(o => o.Items)
                .HasForeignKey(oi => oi.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            // Restrict keeps historical line items intact when someone tries
            // to delete a product that appears in past orders.
            e.HasOne<Product>()
                .WithMany()
                .HasForeignKey(oi => oi.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        base.OnModelCreating(modelBuilder);
    }
}
