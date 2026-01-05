# .NET Core SQL Server Integration

## Table of Contents
1. [Entity Framework Core](#entity-framework-core)
2. [Dapper](#dapper)
3. [SqlBulkCopy](#sqlbulkcopy)
4. [Transaction Patterns](#transaction-patterns)
5. [Connection Resiliency](#connection-resiliency)

## Entity Framework Core

### DbContext Setup
```csharp
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Product> Products => Set<Product>();
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Order>(e =>
        {
            e.ToTable("Orders");
            e.HasKey(x => x.Id);
            e.Property(x => x.TotalAmount).HasColumnType("decimal(18,2)");
            e.HasIndex(x => x.CustomerId);
            e.HasIndex(x => new { x.Status, x.OrderDate });
        });
        
        modelBuilder.Entity<Customer>(e =>
        {
            e.HasMany(c => c.Orders)
             .WithOne(o => o.Customer)
             .HasForeignKey(o => o.CustomerId)
             .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
```

### DI Registration
```csharp
// Program.cs
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default"),
        sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorNumbersToAdd: null);
            sqlOptions.CommandTimeout(30);
            sqlOptions.MigrationsHistoryTable("__EFMigrations", "dbo");
        }));

// For read-heavy workloads
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString)
           .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking));
```

### Raw SQL Queries
```csharp
// Interpolated (safe from SQL injection)
var orders = await context.Orders
    .FromSqlInterpolated($@"
        SELECT * FROM Orders 
        WHERE CustomerId = {customerId} 
        AND Status = {status}")
    .Include(o => o.Customer)
    .ToListAsync();

// Raw with parameters
var results = await context.Orders
    .FromSqlRaw("SELECT * FROM Orders WHERE TotalAmount > @amount",
        new SqlParameter("@amount", minAmount))
    .ToListAsync();
```

### Stored Procedures
```csharp
// Query stored procedure (EF Core 8+)
var summaries = await context.Database
    .SqlQuery<OrderSummaryDto>($"EXEC dbo.GetOrderSummary @CustomerId = {customerId}")
    .ToListAsync();

// Execute stored procedure (no result)
await context.Database.ExecuteSqlInterpolatedAsync(
    $"EXEC dbo.ProcessOrders @BatchSize = {batchSize}");

// With output parameter
var outputParam = new SqlParameter("@TotalCount", SqlDbType.Int) { Direction = ParameterDirection.Output };
await context.Database.ExecuteSqlRawAsync(
    "EXEC dbo.GetOrderCount @CustomerId = @cid, @TotalCount = @TotalCount OUTPUT",
    new SqlParameter("@cid", customerId), outputParam);
var count = (int)outputParam.Value;
```

### Bulk Operations
```csharp
// EF Core bulk insert (slower but tracked)
await context.Orders.AddRangeAsync(orders);
await context.SaveChangesAsync();

// ExecuteUpdate (EF Core 7+)
await context.Orders
    .Where(o => o.Status == "Pending" && o.OrderDate < cutoffDate)
    .ExecuteUpdateAsync(s => s
        .SetProperty(o => o.Status, "Expired")
        .SetProperty(o => o.ModifiedAt, DateTime.UtcNow));

// ExecuteDelete (EF Core 7+)
await context.Orders
    .Where(o => o.Status == "Cancelled" && o.OrderDate < archiveDate)
    .ExecuteDeleteAsync();
```

## Dapper

### Setup
```csharp
public class DapperContext
{
    private readonly string _connectionString;
    
    public DapperContext(IConfiguration config)
        => _connectionString = config.GetConnectionString("Default")!;
    
    public IDbConnection CreateConnection() => new SqlConnection(_connectionString);
}

// DI Registration
builder.Services.AddSingleton<DapperContext>();
```

### Basic Queries
```csharp
public class OrderRepository
{
    private readonly DapperContext _context;
    
    public async Task<IEnumerable<Order>> GetByCustomerAsync(int customerId)
    {
        using var conn = _context.CreateConnection();
        return await conn.QueryAsync<Order>(
            "SELECT * FROM Orders WHERE CustomerId = @CustomerId ORDER BY OrderDate DESC",
            new { CustomerId = customerId });
    }
    
    public async Task<Order?> GetByIdAsync(int id)
    {
        using var conn = _context.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<Order>(
            "SELECT * FROM Orders WHERE Id = @Id",
            new { Id = id });
    }
    
    public async Task<int> InsertAsync(Order order)
    {
        using var conn = _context.CreateConnection();
        return await conn.ExecuteScalarAsync<int>(@"
            INSERT INTO Orders (CustomerId, OrderDate, TotalAmount, Status)
            VALUES (@CustomerId, @OrderDate, @TotalAmount, @Status);
            SELECT SCOPE_IDENTITY();", order);
    }
}
```

### Stored Procedures
```csharp
public async Task<OrderSummary> GetSummaryAsync(int customerId)
{
    using var conn = _context.CreateConnection();
    return await conn.QueryFirstOrDefaultAsync<OrderSummary>(
        "dbo.GetOrderSummary",
        new { CustomerId = customerId },
        commandType: CommandType.StoredProcedure);
}

// With output parameter
public async Task<(IEnumerable<Order>, int)> GetPagedAsync(int page, int pageSize)
{
    using var conn = _context.CreateConnection();
    var parameters = new DynamicParameters();
    parameters.Add("@Page", page);
    parameters.Add("@PageSize", pageSize);
    parameters.Add("@TotalCount", dbType: DbType.Int32, direction: ParameterDirection.Output);
    
    var orders = await conn.QueryAsync<Order>("dbo.GetOrdersPaged", parameters,
        commandType: CommandType.StoredProcedure);
    
    return (orders, parameters.Get<int>("@TotalCount"));
}
```

### Multi-Mapping (Joins)
```csharp
public async Task<IEnumerable<Order>> GetWithCustomerAsync()
{
    using var conn = _context.CreateConnection();
    return await conn.QueryAsync<Order, Customer, Order>(
        @"SELECT o.*, c.* FROM Orders o 
          JOIN Customers c ON o.CustomerId = c.Id",
        (order, customer) =>
        {
            order.Customer = customer;
            return order;
        },
        splitOn: "Id");
}
```

### Multiple Result Sets
```csharp
public async Task<DashboardData> GetDashboardAsync(int userId)
{
    using var conn = _context.CreateConnection();
    using var multi = await conn.QueryMultipleAsync(
        "dbo.GetDashboard", new { UserId = userId },
        commandType: CommandType.StoredProcedure);
    
    return new DashboardData
    {
        Summary = await multi.ReadFirstAsync<Summary>(),
        RecentOrders = (await multi.ReadAsync<Order>()).ToList(),
        TopProducts = (await multi.ReadAsync<Product>()).ToList()
    };
}
```

### Bulk Insert with Dapper
```csharp
public async Task BulkInsertAsync(IEnumerable<Order> orders)
{
    using var conn = _context.CreateConnection();
    conn.Open();
    using var tx = conn.BeginTransaction();
    try
    {
        await conn.ExecuteAsync(@"
            INSERT INTO Orders (CustomerId, OrderDate, TotalAmount, Status)
            VALUES (@CustomerId, @OrderDate, @TotalAmount, @Status)",
            orders, transaction: tx);
        tx.Commit();
    }
    catch
    {
        tx.Rollback();
        throw;
    }
}
```

## SqlBulkCopy

### Basic Usage
```csharp
public async Task BulkCopyAsync<T>(IEnumerable<T> data, string tableName)
{
    var dataTable = ToDataTable(data);
    
    using var conn = new SqlConnection(_connectionString);
    await conn.OpenAsync();
    
    using var bulk = new SqlBulkCopy(conn)
    {
        DestinationTableName = tableName,
        BatchSize = 10000,
        BulkCopyTimeout = 600,
        EnableStreaming = true
    };
    
    // Map columns
    foreach (DataColumn col in dataTable.Columns)
        bulk.ColumnMappings.Add(col.ColumnName, col.ColumnName);
    
    await bulk.WriteToServerAsync(dataTable);
}

private DataTable ToDataTable<T>(IEnumerable<T> data)
{
    var table = new DataTable();
    var props = typeof(T).GetProperties();
    
    foreach (var prop in props)
        table.Columns.Add(prop.Name, Nullable.GetUnderlyingType(prop.PropertyType) ?? prop.PropertyType);
    
    foreach (var item in data)
    {
        var row = table.NewRow();
        foreach (var prop in props)
            row[prop.Name] = prop.GetValue(item) ?? DBNull.Value;
        table.Rows.Add(row);
    }
    return table;
}
```

### With Transaction
```csharp
public async Task BulkCopyWithTransactionAsync(DataTable data, string tableName)
{
    using var conn = new SqlConnection(_connectionString);
    await conn.OpenAsync();
    using var tx = conn.BeginTransaction();
    
    try
    {
        using var bulk = new SqlBulkCopy(conn, SqlBulkCopyOptions.TableLock, tx)
        {
            DestinationTableName = tableName,
            BatchSize = 5000
        };
        await bulk.WriteToServerAsync(data);
        await tx.CommitAsync();
    }
    catch
    {
        await tx.RollbackAsync();
        throw;
    }
}
```

## Transaction Patterns

### Unit of Work with EF Core
```csharp
public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken ct = default);
    Task BeginTransactionAsync();
    Task CommitAsync();
    Task RollbackAsync();
}

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private IDbContextTransaction? _transaction;
    
    public async Task BeginTransactionAsync()
        => _transaction = await _context.Database.BeginTransactionAsync();
    
    public async Task CommitAsync()
    {
        await _context.SaveChangesAsync();
        if (_transaction != null) await _transaction.CommitAsync();
    }
    
    public async Task RollbackAsync()
    {
        if (_transaction != null) await _transaction.RollbackAsync();
    }
    
    public Task<int> SaveChangesAsync(CancellationToken ct = default)
        => _context.SaveChangesAsync(ct);
}
```

### TransactionScope
```csharp
public async Task ProcessOrderAsync(Order order, Payment payment)
{
    using var scope = new TransactionScope(
        TransactionScopeOption.Required,
        new TransactionOptions { IsolationLevel = IsolationLevel.ReadCommitted },
        TransactionScopeAsyncFlowOption.Enabled);
    
    await _orderRepository.InsertAsync(order);
    await _paymentRepository.InsertAsync(payment);
    await _inventoryService.DeductStockAsync(order.Items);
    
    scope.Complete();
}
```

## Connection Resiliency

### Polly Integration
```csharp
builder.Services.AddDbContext<AppDbContext>((sp, options) =>
{
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: new[] { 4060, 40197, 40501, 40613, 49918, 49919, 49920 });
    });
});

// Custom retry policy for Dapper
public class ResilientDapperContext
{
    private readonly AsyncRetryPolicy _retryPolicy;
    
    public ResilientDapperContext()
    {
        _retryPolicy = Policy
            .Handle<SqlException>(ex => IsTransient(ex))
            .WaitAndRetryAsync(3, attempt => TimeSpan.FromSeconds(Math.Pow(2, attempt)));
    }
    
    public async Task<T> ExecuteAsync<T>(Func<IDbConnection, Task<T>> action)
    {
        return await _retryPolicy.ExecuteAsync(async () =>
        {
            using var conn = new SqlConnection(_connectionString);
            return await action(conn);
        });
    }
    
    private bool IsTransient(SqlException ex)
        => new[] { -2, 4060, 40197, 40501, 40613 }.Contains(ex.Number);
}
```