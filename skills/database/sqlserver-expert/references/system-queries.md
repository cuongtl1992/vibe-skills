# System Queries & Metadata

## Table of Contents
1. [Schema Information](#schema-information)
2. [Index Information](#index-information)
3. [Foreign Keys & Constraints](#foreign-keys--constraints)
4. [Storage & Size](#storage--size)
5. [Security & Permissions](#security--permissions)
6. [Server Configuration](#server-configuration)

## Schema Information

### List All Tables
```sql
SELECT 
  TABLE_SCHEMA,
  TABLE_NAME,
  TABLE_TYPE
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_SCHEMA, TABLE_NAME;
```

### Table Structure (Columns)
```sql
SELECT
  c.COLUMN_NAME,
  c.DATA_TYPE,
  c.CHARACTER_MAXIMUM_LENGTH,
  c.NUMERIC_PRECISION,
  c.NUMERIC_SCALE,
  c.IS_NULLABLE,
  c.COLUMN_DEFAULT,
  COLUMNPROPERTY(OBJECT_ID(c.TABLE_SCHEMA + '.' + c.TABLE_NAME), c.COLUMN_NAME, 'IsIdentity') AS IsIdentity
FROM INFORMATION_SCHEMA.COLUMNS c
WHERE c.TABLE_SCHEMA = @Schema AND c.TABLE_NAME = @TableName
ORDER BY c.ORDINAL_POSITION;
```

### Stored Procedures
```sql
SELECT 
  SCHEMA_NAME(schema_id) AS schema_name,
  name AS procedure_name,
  create_date,
  modify_date
FROM sys.procedures
WHERE is_ms_shipped = 0
ORDER BY schema_name, procedure_name;
```

### Get Procedure/Function Definition
```sql
-- Method 1
SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.YourProcedure'));

-- Method 2
EXEC sp_helptext 'dbo.YourProcedure';

-- Method 3 (full metadata)
SELECT 
  ROUTINE_NAME,
  ROUTINE_TYPE,
  ROUTINE_DEFINITION
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_NAME = 'YourProcedure';
```

### Views
```sql
SELECT 
  SCHEMA_NAME(schema_id) AS schema_name,
  name AS view_name,
  create_date,
  modify_date
FROM sys.views
WHERE is_ms_shipped = 0
ORDER BY schema_name, view_name;
```

### Triggers
```sql
SELECT 
  OBJECT_NAME(parent_id) AS table_name,
  name AS trigger_name,
  is_disabled,
  is_instead_of_trigger,
  create_date
FROM sys.triggers
WHERE parent_class = 1  -- Object triggers
ORDER BY table_name, trigger_name;
```

## Index Information

### All Indexes on Table
```sql
SELECT
  i.name AS index_name,
  i.type_desc AS index_type,
  i.is_unique,
  i.is_primary_key,
  i.is_unique_constraint,
  STRING_AGG(c.name, ', ') WITHIN GROUP (ORDER BY ic.key_ordinal) AS key_columns,
  STRING_AGG(CASE WHEN ic.is_included_column = 1 THEN c.name END, ', ') AS included_columns,
  i.filter_definition
FROM sys.indexes i
JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID(@TableName) AND i.type > 0
GROUP BY i.name, i.type_desc, i.is_unique, i.is_primary_key, i.is_unique_constraint, i.filter_definition
ORDER BY i.is_primary_key DESC, i.name;
```

### Index Columns Detail
```sql
SELECT 
  i.name AS index_name,
  c.name AS column_name,
  ic.key_ordinal,
  ic.is_descending_key,
  ic.is_included_column
FROM sys.indexes i
JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID(@TableName)
ORDER BY i.name, ic.key_ordinal;
```

### All Indexes in Database
```sql
SELECT 
  OBJECT_SCHEMA_NAME(i.object_id) AS schema_name,
  OBJECT_NAME(i.object_id) AS table_name,
  i.name AS index_name,
  i.type_desc,
  i.is_unique,
  i.is_primary_key
FROM sys.indexes i
WHERE OBJECTPROPERTY(i.object_id, 'IsUserTable') = 1 AND i.type > 0
ORDER BY schema_name, table_name, i.name;
```

## Foreign Keys & Constraints

### Foreign Keys on Table
```sql
SELECT
  fk.name AS fk_name,
  OBJECT_NAME(fk.parent_object_id) AS parent_table,
  COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS parent_column,
  OBJECT_NAME(fk.referenced_object_id) AS referenced_table,
  COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS referenced_column,
  fk.delete_referential_action_desc AS on_delete,
  fk.update_referential_action_desc AS on_update,
  fk.is_disabled
FROM sys.foreign_keys fk
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
WHERE fk.parent_object_id = OBJECT_ID(@TableName)
   OR fk.referenced_object_id = OBJECT_ID(@TableName)
ORDER BY fk.name;
```

### All Constraints on Table
```sql
SELECT 
  tc.CONSTRAINT_NAME,
  tc.CONSTRAINT_TYPE,
  STRING_AGG(kcu.COLUMN_NAME, ', ') AS columns,
  cc.CHECK_CLAUSE
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu 
  ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME AND tc.TABLE_NAME = kcu.TABLE_NAME
LEFT JOIN INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc 
  ON tc.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
WHERE tc.TABLE_NAME = @TableName
GROUP BY tc.CONSTRAINT_NAME, tc.CONSTRAINT_TYPE, cc.CHECK_CLAUSE
ORDER BY tc.CONSTRAINT_TYPE;
```

### Default Constraints
```sql
SELECT 
  c.name AS column_name,
  dc.name AS constraint_name,
  dc.definition
FROM sys.default_constraints dc
JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
WHERE dc.parent_object_id = OBJECT_ID(@TableName);
```

## Storage & Size

### Table Sizes
```sql
SELECT 
  SCHEMA_NAME(t.schema_id) AS schema_name,
  t.name AS table_name,
  p.rows AS row_count,
  CAST(SUM(a.total_pages) * 8 / 1024.0 AS DECIMAL(18,2)) AS total_mb,
  CAST(SUM(a.used_pages) * 8 / 1024.0 AS DECIMAL(18,2)) AS used_mb,
  CAST((SUM(a.total_pages) - SUM(a.used_pages)) * 8 / 1024.0 AS DECIMAL(18,2)) AS unused_mb
FROM sys.tables t
JOIN sys.indexes i ON t.object_id = i.object_id
JOIN sys.partitions p ON i.object_id = p.object_id AND i.index_id = p.index_id
JOIN sys.allocation_units a ON p.partition_id = a.container_id
WHERE t.is_ms_shipped = 0 AND i.index_id <= 1
GROUP BY t.schema_id, t.name, p.rows
ORDER BY SUM(a.total_pages) DESC;
```

### Index Sizes
```sql
SELECT 
  OBJECT_NAME(i.object_id) AS table_name,
  i.name AS index_name,
  i.type_desc,
  CAST(SUM(ps.used_page_count) * 8 / 1024.0 AS DECIMAL(18,2)) AS size_mb,
  SUM(ps.row_count) AS row_count
FROM sys.indexes i
JOIN sys.dm_db_partition_stats ps ON i.object_id = ps.object_id AND i.index_id = ps.index_id
WHERE OBJECTPROPERTY(i.object_id, 'IsUserTable') = 1
GROUP BY i.object_id, i.name, i.type_desc
ORDER BY SUM(ps.used_page_count) DESC;
```

### Database Size
```sql
SELECT 
  DB_NAME() AS database_name,
  CAST(SUM(size) * 8 / 1024.0 AS DECIMAL(18,2)) AS total_mb,
  CAST(SUM(CASE WHEN type = 0 THEN size ELSE 0 END) * 8 / 1024.0 AS DECIMAL(18,2)) AS data_mb,
  CAST(SUM(CASE WHEN type = 1 THEN size ELSE 0 END) * 8 / 1024.0 AS DECIMAL(18,2)) AS log_mb
FROM sys.database_files;
```

### File Growth Settings
```sql
SELECT 
  name AS file_name,
  type_desc,
  physical_name,
  CAST(size * 8 / 1024.0 AS DECIMAL(18,2)) AS size_mb,
  CASE 
    WHEN is_percent_growth = 1 THEN CAST(growth AS VARCHAR) + '%'
    ELSE CAST(growth * 8 / 1024 AS VARCHAR) + ' MB'
  END AS growth,
  CASE max_size
    WHEN -1 THEN 'Unlimited'
    WHEN 0 THEN 'No Growth'
    ELSE CAST(max_size * 8 / 1024 AS VARCHAR) + ' MB'
  END AS max_size
FROM sys.database_files;
```

## Security & Permissions

### Database Users
```sql
SELECT 
  dp.name AS user_name,
  dp.type_desc AS user_type,
  sp.name AS login_name,
  dp.default_schema_name,
  dp.create_date
FROM sys.database_principals dp
LEFT JOIN sys.server_principals sp ON dp.sid = sp.sid
WHERE dp.type IN ('S', 'U', 'G')  -- SQL user, Windows user, Windows group
ORDER BY dp.name;
```

### Role Members
```sql
SELECT 
  r.name AS role_name,
  m.name AS member_name,
  m.type_desc AS member_type
FROM sys.database_role_members rm
JOIN sys.database_principals r ON rm.role_principal_id = r.principal_id
JOIN sys.database_principals m ON rm.member_principal_id = m.principal_id
ORDER BY r.name, m.name;
```

### Object Permissions
```sql
SELECT 
  dp.name AS principal_name,
  dp.type_desc AS principal_type,
  OBJECT_SCHEMA_NAME(p.major_id) AS schema_name,
  OBJECT_NAME(p.major_id) AS object_name,
  p.permission_name,
  p.state_desc AS permission_state
FROM sys.database_permissions p
JOIN sys.database_principals dp ON p.grantee_principal_id = dp.principal_id
WHERE p.class = 1  -- Object permissions
  AND OBJECT_NAME(p.major_id) IS NOT NULL
ORDER BY dp.name, OBJECT_NAME(p.major_id);
```

### Schema Permissions
```sql
SELECT 
  dp.name AS principal_name,
  s.name AS schema_name,
  p.permission_name,
  p.state_desc
FROM sys.database_permissions p
JOIN sys.database_principals dp ON p.grantee_principal_id = dp.principal_id
JOIN sys.schemas s ON p.major_id = s.schema_id
WHERE p.class = 3  -- Schema permissions
ORDER BY dp.name, s.name;
```

## Server Configuration

### Server Properties
```sql
SELECT 
  SERVERPROPERTY('ProductVersion') AS Version,
  SERVERPROPERTY('ProductLevel') AS ProductLevel,
  SERVERPROPERTY('Edition') AS Edition,
  SERVERPROPERTY('EngineEdition') AS EngineEdition,
  SERVERPROPERTY('MachineName') AS MachineName,
  SERVERPROPERTY('ServerName') AS ServerName,
  SERVERPROPERTY('Collation') AS Collation,
  SERVERPROPERTY('IsFullTextInstalled') AS FullTextInstalled,
  SERVERPROPERTY('IsClustered') AS IsClustered;
```

### Database Settings
```sql
SELECT 
  name,
  compatibility_level,
  collation_name,
  recovery_model_desc,
  is_auto_shrink_on,
  is_auto_create_stats_on,
  is_auto_update_stats_on,
  is_read_committed_snapshot_on,
  snapshot_isolation_state_desc
FROM sys.databases
WHERE name = DB_NAME();
```

### Memory Usage
```sql
SELECT 
  type,
  SUM(pages_kb) / 1024 AS size_mb
FROM sys.dm_os_memory_clerks
GROUP BY type
ORDER BY SUM(pages_kb) DESC;
```