# Change Data Capture (CDC)

## Table of Contents
1. [Setup CDC](#setup-cdc)
2. [Query CDC Data](#query-cdc-data)
3. [CDC Consumer in C#](#cdc-consumer-in-c)
4. [Kafka Integration](#kafka-integration)
5. [Multi-tenant Patterns](#multi-tenant-patterns)
6. [Maintenance & Troubleshooting](#maintenance--troubleshooting)

## Setup CDC

### Enable CDC on Database
```sql
-- Enable CDC
EXEC sys.sp_cdc_enable_db;

-- Verify
SELECT name, is_cdc_enabled FROM sys.databases WHERE name = DB_NAME();
```

### Enable CDC on Table
```sql
-- Basic enable
EXEC sys.sp_cdc_enable_table
  @source_schema = N'dbo',
  @source_name = N'Orders',
  @role_name = NULL,
  @supports_net_changes = 1;

-- With specific columns and custom capture instance
EXEC sys.sp_cdc_enable_table
  @source_schema = N'dbo',
  @source_name = N'Orders',
  @role_name = NULL,
  @capture_instance = N'dbo_Orders_v1',
  @supports_net_changes = 1,
  @index_name = N'PK_Orders',
  @captured_column_list = N'Id,CustomerId,OrderDate,TotalAmount,Status,ModifiedAt';
```

### Disable CDC
```sql
-- Disable on table
EXEC sys.sp_cdc_disable_table
  @source_schema = N'dbo',
  @source_name = N'Orders',
  @capture_instance = N'dbo_Orders_v1';

-- Disable on database
EXEC sys.sp_cdc_disable_db;
```

## Query CDC Data

### Get All Changes
```sql
DECLARE @from_lsn binary(10), @to_lsn binary(10);
SET @from_lsn = sys.fn_cdc_get_min_lsn('dbo_Orders');
SET @to_lsn = sys.fn_cdc_get_max_lsn();

SELECT 
  CASE __$operation 
    WHEN 1 THEN 'DELETE'
    WHEN 2 THEN 'INSERT'
    WHEN 3 THEN 'BEFORE_UPDATE'
    WHEN 4 THEN 'AFTER_UPDATE'
  END AS operation,
  __$start_lsn,
  sys.fn_cdc_map_lsn_to_time(__$start_lsn) AS change_time,
  Id, CustomerId, TotalAmount, Status
FROM cdc.fn_cdc_get_all_changes_dbo_Orders(@from_lsn, @to_lsn, N'all')
ORDER BY __$start_lsn;
```

### Get Net Changes (Consolidated)
```sql
DECLARE @from_lsn binary(10), @to_lsn binary(10);
SET @from_lsn = sys.fn_cdc_get_min_lsn('dbo_Orders');
SET @to_lsn = sys.fn_cdc_get_max_lsn();

SELECT 
  CASE __$operation 
    WHEN 1 THEN 'DELETE'
    WHEN 2 THEN 'INSERT'
    WHEN 5 THEN 'UPDATE'
  END AS operation,
  Id, CustomerId, TotalAmount, Status
FROM cdc.fn_cdc_get_net_changes_dbo_Orders(@from_lsn, @to_lsn, N'all');
```

### Get Changes by Time Range
```sql
DECLARE @from_lsn binary(10), @to_lsn binary(10);
DECLARE @start_time datetime = DATEADD(HOUR, -1, GETDATE());
DECLARE @end_time datetime = GETDATE();

SET @from_lsn = sys.fn_cdc_map_time_to_lsn('smallest greater than or equal', @start_time);
SET @to_lsn = sys.fn_cdc_map_time_to_lsn('largest less than or equal', @end_time);

IF @from_lsn IS NOT NULL AND @to_lsn IS NOT NULL
BEGIN
  SELECT * FROM cdc.fn_cdc_get_all_changes_dbo_Orders(@from_lsn, @to_lsn, N'all');
END
```

### Check Which Columns Changed
```sql
SELECT 
  __$operation,
  __$update_mask,
  -- Check if specific column changed (column ordinal from sys.columns)
  CASE WHEN sys.fn_cdc_is_bit_set(1, __$update_mask) = 1 THEN 'Y' ELSE 'N' END AS Id_Changed,
  CASE WHEN sys.fn_cdc_is_bit_set(2, __$update_mask) = 1 THEN 'Y' ELSE 'N' END AS CustomerId_Changed,
  *
FROM cdc.fn_cdc_get_all_changes_dbo_Orders(@from_lsn, @to_lsn, N'all')
WHERE __$operation IN (3, 4);  -- Updates only
```

## CDC Consumer in C#

### Basic Consumer Service
```csharp
public class CdcConsumerService
{
    private readonly string _connectionString;
    private readonly ILogger<CdcConsumerService> _logger;
    
    public async Task<IEnumerable<CdcChange<T>>> GetChangesAsync<T>(
        string captureInstance,
        byte[]? fromLsn = null)
    {
        using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync();
        
        // Get LSN range
        var minLsn = fromLsn ?? await GetMinLsnAsync(conn, captureInstance);
        var maxLsn = await GetMaxLsnAsync(conn);
        
        if (minLsn == null || maxLsn == null || CompareIan(minLsn, maxLsn) >= 0)
            return Enumerable.Empty<CdcChange<T>>();
        
        var sql = $@"
            SELECT 
                __$operation AS Operation,
                __$start_lsn AS Lsn,
                sys.fn_cdc_map_lsn_to_time(__$start_lsn) AS ChangeTime,
                *
            FROM cdc.fn_cdc_get_all_changes_{captureInstance}(@from, @to, N'all')
            ORDER BY __$start_lsn";
        
        return await conn.QueryAsync<CdcChange<T>>(sql, new { from = minLsn, to = maxLsn });
    }
    
    private async Task<byte[]?> GetMinLsnAsync(SqlConnection conn, string captureInstance)
    {
        return await conn.ExecuteScalarAsync<byte[]>(
            $"SELECT sys.fn_cdc_get_min_lsn('{captureInstance}')");
    }
    
    private async Task<byte[]?> GetMaxLsnAsync(SqlConnection conn)
    {
        return await conn.ExecuteScalarAsync<byte[]>("SELECT sys.fn_cdc_get_max_lsn()");
    }
    
    private int CompareLsn(byte[] lsn1, byte[] lsn2)
    {
        for (int i = 0; i < 10; i++)
        {
            if (lsn1[i] < lsn2[i]) return -1;
            if (lsn1[i] > lsn2[i]) return 1;
        }
        return 0;
    }
}

public class CdcChange<T>
{
    public int Operation { get; set; }  // 1=Delete, 2=Insert, 3=BeforeUpdate, 4=AfterUpdate
    public byte[] Lsn { get; set; } = null!;
    public DateTime ChangeTime { get; set; }
    public T Data { get; set; } = default!;
    
    public string OperationType => Operation switch
    {
        1 => "DELETE",
        2 => "INSERT",
        3 => "BEFORE_UPDATE",
        4 => "AFTER_UPDATE",
        5 => "UPDATE",
        _ => "UNKNOWN"
    };
}
```

### Checkpoint Management
```csharp
public class CdcCheckpointService
{
    private readonly string _connectionString;
    
    public async Task<byte[]?> GetCheckpointAsync(string captureInstance)
    {
        using var conn = new SqlConnection(_connectionString);
        return await conn.ExecuteScalarAsync<byte[]>(@"
            SELECT LastProcessedLsn FROM dbo.CdcCheckpoints 
            WHERE CaptureInstance = @CaptureInstance",
            new { CaptureInstance = captureInstance });
    }
    
    public async Task SaveCheckpointAsync(string captureInstance, byte[] lsn, int processedCount)
    {
        using var conn = new SqlConnection(_connectionString);
        await conn.ExecuteAsync(@"
            MERGE dbo.CdcCheckpoints AS target
            USING (SELECT @CaptureInstance, @Lsn, @Count) AS source(CaptureInstance, Lsn, Count)
            ON target.CaptureInstance = source.CaptureInstance
            WHEN MATCHED THEN
                UPDATE SET LastProcessedLsn = source.Lsn, 
                           ProcessedCount = target.ProcessedCount + source.Count,
                           LastProcessedAt = SYSUTCDATETIME()
            WHEN NOT MATCHED THEN
                INSERT (CaptureInstance, LastProcessedLsn, ProcessedCount, LastProcessedAt)
                VALUES (source.CaptureInstance, source.Lsn, source.Count, SYSUTCDATETIME());",
            new { CaptureInstance = captureInstance, Lsn = lsn, Count = processedCount });
    }
}
```

## Kafka Integration

### Checkpoint Table for Kafka
```sql
CREATE TABLE dbo.CdcKafkaCheckpoints (
    CaptureInstance NVARCHAR(256) PRIMARY KEY,
    LastProcessedLsn BINARY(10) NOT NULL,
    KafkaOffset BIGINT NULL,
    ProcessedCount BIGINT NOT NULL DEFAULT 0,
    LastProcessedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
```

### Producer Service
```csharp
public class CdcKafkaProducerService : BackgroundService
{
    private readonly IProducer<string, string> _producer;
    private readonly CdcConsumerService _cdcService;
    private readonly CdcCheckpointService _checkpointService;
    private readonly string _captureInstance;
    private readonly string _topic;
    
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var checkpoint = await _checkpointService.GetCheckpointAsync(_captureInstance);
                var changes = await _cdcService.GetChangesAsync<Order>(_captureInstance, checkpoint);
                
                byte[]? lastLsn = null;
                int count = 0;
                
                foreach (var change in changes)
                {
                    var message = new Message<string, string>
                    {
                        Key = change.Data.Id.ToString(),
                        Value = JsonSerializer.Serialize(new
                        {
                            Operation = change.OperationType,
                            Timestamp = change.ChangeTime,
                            Data = change.Data
                        })
                    };
                    
                    await _producer.ProduceAsync(_topic, message, stoppingToken);
                    lastLsn = change.Lsn;
                    count++;
                }
                
                if (lastLsn != null)
                    await _checkpointService.SaveCheckpointAsync(_captureInstance, lastLsn, count);
                
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing CDC changes");
                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
            }
        }
    }
}
```

## Multi-tenant Patterns

### Database-per-Tenant CDC Setup
```csharp
public class MultiTenantCdcService
{
    public async Task EnableCdcForTenantAsync(string tenantConnectionString, string tableName)
    {
        using var conn = new SqlConnection(tenantConnectionString);
        
        // Enable CDC on database
        await conn.ExecuteAsync("EXEC sys.sp_cdc_enable_db");
        
        // Enable CDC on table
        await conn.ExecuteAsync(@"
            EXEC sys.sp_cdc_enable_table
                @source_schema = N'dbo',
                @source_name = @TableName,
                @role_name = NULL,
                @supports_net_changes = 1",
            new { TableName = tableName });
    }
    
    public async Task ProcessAllTenantsAsync(IEnumerable<TenantInfo> tenants)
    {
        var tasks = tenants.Select(t => ProcessTenantChangesAsync(t));
        await Task.WhenAll(tasks);
    }
}
```

### Shared Database with TenantId
```sql
-- Query changes for specific tenant
DECLARE @TenantId INT = 123;

SELECT *
FROM cdc.fn_cdc_get_all_changes_dbo_Orders(@from_lsn, @to_lsn, N'all')
WHERE TenantId = @TenantId;
```

## Maintenance & Troubleshooting

### Check CDC Status
```sql
-- CDC-enabled tables
SELECT 
  OBJECT_SCHEMA_NAME(source_object_id) AS source_schema,
  OBJECT_NAME(source_object_id) AS source_table,
  capture_instance,
  create_date,
  supports_net_changes,
  index_name
FROM cdc.change_tables;

-- CDC jobs
SELECT * FROM msdb.dbo.cdc_jobs;

-- CDC errors
SELECT * FROM sys.dm_cdc_errors ORDER BY entry_time DESC;
```

### Configure Retention
```sql
-- Check current retention (minutes)
EXEC sys.sp_cdc_help_jobs;

-- Change retention to 7 days (10080 minutes)
EXEC sys.sp_cdc_change_job
  @job_type = N'cleanup',
  @retention = 10080;

-- Change polling interval (seconds)
EXEC sys.sp_cdc_change_job
  @job_type = N'capture',
  @pollinginterval = 5;
```

### Manual Cleanup
```sql
-- Get current min LSN
DECLARE @min_lsn binary(10) = sys.fn_cdc_get_min_lsn('dbo_Orders');

-- Calculate LSN for 3 days ago
DECLARE @cleanup_time datetime = DATEADD(DAY, -3, GETDATE());
DECLARE @cleanup_lsn binary(10) = sys.fn_cdc_map_time_to_lsn('largest less than', @cleanup_time);

-- Execute cleanup
EXEC sys.sp_cdc_cleanup_change_table
  @capture_instance = N'dbo_Orders',
  @low_water_mark = @cleanup_lsn,
  @threshold = 5000;
```

### Troubleshooting Common Issues

**CDC not capturing:**
```sql
-- Check SQL Agent is running
EXEC msdb.dbo.sp_help_job @job_name = N'cdc.YourDB_capture';

-- Check for errors
SELECT * FROM sys.dm_cdc_errors ORDER BY entry_time DESC;

-- Restart capture job
EXEC sys.sp_cdc_start_job @job_type = N'capture';
```

**Large CDC tables:**
```sql
-- Check CDC table sizes
SELECT 
  OBJECT_NAME(object_id) AS table_name,
  SUM(reserved_page_count) * 8 / 1024 AS size_mb
FROM sys.dm_db_partition_stats
WHERE OBJECT_NAME(object_id) LIKE 'dbo_Orders%'
GROUP BY object_id;
```