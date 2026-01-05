# Performance Tuning & Deadlock Analysis

## Table of Contents
1. [Query Performance Analysis](#query-performance-analysis)
2. [Index Optimization](#index-optimization)
3. [Deadlock Detection & Resolution](#deadlock-detection--resolution)
4. [Wait Statistics](#wait-statistics)
5. [Query Store](#query-store)

## Query Performance Analysis

### Top CPU-Consuming Queries
```sql
SELECT TOP 20
  qs.execution_count,
  qs.total_worker_time / 1000 AS total_cpu_ms,
  qs.total_worker_time / qs.execution_count / 1000 AS avg_cpu_ms,
  qs.total_elapsed_time / qs.execution_count / 1000 AS avg_duration_ms,
  qs.total_logical_reads / qs.execution_count AS avg_logical_reads,
  SUBSTRING(st.text, (qs.statement_start_offset/2)+1,
    ((CASE qs.statement_end_offset WHEN -1 THEN DATALENGTH(st.text)
      ELSE qs.statement_end_offset END - qs.statement_start_offset)/2)+1) AS query_text,
  qp.query_plan
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
CROSS APPLY sys.dm_exec_query_plan(qs.plan_handle) qp
ORDER BY qs.total_worker_time DESC;
```

### Currently Running Queries
```sql
SELECT 
  r.session_id,
  r.status,
  r.command,
  r.wait_type,
  r.wait_time,
  r.blocking_session_id,
  r.cpu_time,
  r.total_elapsed_time / 1000 AS elapsed_sec,
  r.logical_reads,
  DB_NAME(r.database_id) AS database_name,
  SUBSTRING(st.text, (r.statement_start_offset/2)+1,
    ((CASE r.statement_end_offset WHEN -1 THEN DATALENGTH(st.text)
      ELSE r.statement_end_offset END - r.statement_start_offset)/2)+1) AS query_text
FROM sys.dm_exec_requests r
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) st
WHERE r.session_id > 50 AND r.session_id <> @@SPID
ORDER BY r.total_elapsed_time DESC;
```

### Blocking Analysis
```sql
SELECT 
  blocked.session_id AS blocked_session,
  blocked.wait_type,
  blocked.wait_time / 1000 AS wait_sec,
  blocked.wait_resource,
  blocking.session_id AS blocking_session,
  st_blocked.text AS blocked_query,
  st_blocking.text AS blocking_query
FROM sys.dm_exec_requests blocked
JOIN sys.dm_exec_sessions blocking ON blocked.blocking_session_id = blocking.session_id
CROSS APPLY sys.dm_exec_sql_text(blocked.sql_handle) st_blocked
OUTER APPLY sys.dm_exec_sql_text(blocking.most_recent_sql_handle) st_blocking
WHERE blocked.blocking_session_id > 0;
```

### IO Statistics by Query
```sql
SELECT TOP 20
  qs.total_logical_reads,
  qs.total_logical_writes,
  qs.total_physical_reads,
  qs.execution_count,
  qs.total_logical_reads / qs.execution_count AS avg_reads,
  SUBSTRING(st.text, 1, 200) AS query_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
ORDER BY qs.total_logical_reads DESC;
```

## Index Optimization

### Missing Indexes
```sql
SELECT 
  ROUND(migs.avg_total_user_cost * migs.avg_user_impact * (migs.user_seeks + migs.user_scans), 0) AS improvement,
  mid.statement AS table_name,
  mid.equality_columns,
  mid.inequality_columns,
  mid.included_columns,
  'CREATE INDEX IX_' + OBJECT_NAME(mid.object_id) + '_' 
    + REPLACE(REPLACE(REPLACE(ISNULL(mid.equality_columns, ''), ', ', '_'), '[', ''), ']', '')
    + ' ON ' + mid.statement 
    + ' (' + ISNULL(mid.equality_columns, '')
    + CASE WHEN mid.equality_columns IS NOT NULL AND mid.inequality_columns IS NOT NULL THEN ', ' ELSE '' END
    + ISNULL(mid.inequality_columns, '') + ')'
    + ISNULL(' INCLUDE (' + mid.included_columns + ')', '') AS create_statement
FROM sys.dm_db_missing_index_groups mig
JOIN sys.dm_db_missing_index_group_stats migs ON mig.index_group_handle = migs.group_handle
JOIN sys.dm_db_missing_index_details mid ON mig.index_handle = mid.index_handle
WHERE mid.database_id = DB_ID()
ORDER BY improvement DESC;
```

### Unused Indexes
```sql
SELECT 
  OBJECT_SCHEMA_NAME(i.object_id) + '.' + OBJECT_NAME(i.object_id) AS table_name,
  i.name AS index_name,
  i.type_desc,
  ius.user_seeks,
  ius.user_scans,
  ius.user_lookups,
  ius.user_updates,
  'DROP INDEX ' + i.name + ' ON ' + OBJECT_SCHEMA_NAME(i.object_id) + '.' + OBJECT_NAME(i.object_id) AS drop_statement
FROM sys.indexes i
LEFT JOIN sys.dm_db_index_usage_stats ius 
  ON i.object_id = ius.object_id AND i.index_id = ius.index_id AND ius.database_id = DB_ID()
WHERE OBJECTPROPERTY(i.object_id, 'IsUserTable') = 1
  AND i.type > 0 AND i.is_primary_key = 0 AND i.is_unique_constraint = 0
  AND ISNULL(ius.user_seeks, 0) = 0 AND ISNULL(ius.user_scans, 0) = 0 AND ISNULL(ius.user_lookups, 0) = 0
ORDER BY ius.user_updates DESC;
```

### Index Fragmentation
```sql
SELECT 
  OBJECT_SCHEMA_NAME(ips.object_id) + '.' + OBJECT_NAME(ips.object_id) AS table_name,
  i.name AS index_name,
  ips.index_type_desc,
  ips.avg_fragmentation_in_percent,
  ips.page_count,
  CASE 
    WHEN ips.avg_fragmentation_in_percent > 30 THEN 'ALTER INDEX ' + i.name + ' ON ' + OBJECT_SCHEMA_NAME(ips.object_id) + '.' + OBJECT_NAME(ips.object_id) + ' REBUILD'
    WHEN ips.avg_fragmentation_in_percent > 10 THEN 'ALTER INDEX ' + i.name + ' ON ' + OBJECT_SCHEMA_NAME(ips.object_id) + '.' + OBJECT_NAME(ips.object_id) + ' REORGANIZE'
    ELSE 'OK'
  END AS recommendation
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
WHERE ips.avg_fragmentation_in_percent > 10 
  AND ips.page_count > 1000
  AND i.name IS NOT NULL
ORDER BY ips.avg_fragmentation_in_percent DESC;
```

### Index Usage Statistics
```sql
SELECT 
  OBJECT_NAME(ius.object_id) AS table_name,
  i.name AS index_name,
  i.type_desc,
  ius.user_seeks,
  ius.user_scans,
  ius.user_lookups,
  ius.user_updates,
  ius.last_user_seek,
  ius.last_user_scan,
  CASE WHEN ius.user_updates > (ius.user_seeks + ius.user_scans + ius.user_lookups)
    THEN 'HIGH MAINTENANCE' ELSE 'OK' END AS status
FROM sys.dm_db_index_usage_stats ius
JOIN sys.indexes i ON ius.object_id = i.object_id AND ius.index_id = i.index_id
WHERE ius.database_id = DB_ID() AND OBJECTPROPERTY(ius.object_id, 'IsUserTable') = 1
ORDER BY ius.user_seeks + ius.user_scans + ius.user_lookups DESC;
```

## Deadlock Detection & Resolution

### Extended Events for Deadlocks
```sql
-- Create session
CREATE EVENT SESSION [DeadlockCapture] ON SERVER
ADD EVENT sqlserver.xml_deadlock_report
ADD TARGET package0.event_file(SET filename = N'C:\Temp\Deadlocks.xel', max_file_size = 50)
WITH (MAX_MEMORY = 4096 KB, EVENT_RETENTION_MODE = ALLOW_SINGLE_EVENT_LOSS, 
      MAX_DISPATCH_LATENCY = 5 SECONDS, STARTUP_STATE = ON);

-- Start session
ALTER EVENT SESSION [DeadlockCapture] ON SERVER STATE = START;

-- Query captured deadlocks
SELECT 
  event_data.value('(event/@timestamp)[1]', 'datetime2') AS deadlock_time,
  event_data.query('(event/data[@name="xml_report"]/value/deadlock)[1]') AS deadlock_graph
FROM (
  SELECT CAST(event_data AS XML) AS event_data
  FROM sys.fn_xe_file_target_read_file('C:\Temp\Deadlocks*.xel', NULL, NULL, NULL)
) AS data;
```

### Query Deadlock History from system_health
```sql
SELECT 
  xed.value('@timestamp', 'datetime2(3)') AS deadlock_time,
  xed.query('.') AS deadlock_graph
FROM (
  SELECT CAST(target_data AS XML) AS target_data
  FROM sys.dm_xe_session_targets st
  JOIN sys.dm_xe_sessions s ON s.address = st.event_session_address
  WHERE s.name = 'system_health' AND st.target_name = 'ring_buffer'
) AS data
CROSS APPLY target_data.nodes('RingBufferTarget/event[@name="xml_deadlock_report"]') AS xed(xed)
ORDER BY deadlock_time DESC;
```

### Enable Trace Flags (Legacy)
```sql
DBCC TRACEON (1204, -1);  -- Basic deadlock info
DBCC TRACEON (1222, -1);  -- Detailed XML graph
```

### Deadlock Prevention Strategies
```sql
-- 1. Use SNAPSHOT isolation
ALTER DATABASE YourDB SET ALLOW_SNAPSHOT_ISOLATION ON;
ALTER DATABASE YourDB SET READ_COMMITTED_SNAPSHOT ON;

-- 2. Set lock timeout
SET LOCK_TIMEOUT 5000;  -- 5 seconds

-- 3. Use NOLOCK for read-only queries (use carefully)
SELECT * FROM Orders WITH (NOLOCK) WHERE Status = 'Pending';

-- 4. Use READPAST to skip locked rows
SELECT TOP 10 * FROM Orders WITH (READPAST) WHERE Status = 'Pending';

-- 5. Keep transactions short
BEGIN TRAN
  -- Do work quickly
COMMIT
```

## Wait Statistics

### Top Wait Types
```sql
WITH WaitStats AS (
  SELECT 
    wait_type,
    waiting_tasks_count,
    wait_time_ms,
    signal_wait_time_ms,
    wait_time_ms - signal_wait_time_ms AS resource_wait_time_ms,
    100.0 * wait_time_ms / SUM(wait_time_ms) OVER() AS pct
  FROM sys.dm_os_wait_stats
  WHERE wait_type NOT IN (
    'CLR_SEMAPHORE', 'LAZYWRITER_SLEEP', 'RESOURCE_QUEUE', 'SLEEP_TASK',
    'SLEEP_SYSTEMTASK', 'SQLTRACE_BUFFER_FLUSH', 'WAITFOR', 'LOGMGR_QUEUE',
    'CHECKPOINT_QUEUE', 'REQUEST_FOR_DEADLOCK_SEARCH', 'XE_TIMER_EVENT',
    'BROKER_TO_FLUSH', 'BROKER_TASK_STOP', 'CLR_MANUAL_EVENT',
    'DISPATCHER_QUEUE_SEMAPHORE', 'FT_IFTS_SCHEDULER_IDLE_WAIT',
    'XE_DISPATCHER_WAIT', 'XE_DISPATCHER_JOIN', 'DIRTY_PAGE_POLL',
    'HADR_FILESTREAM_IOMGR_IOCOMPLETION', 'SP_SERVER_DIAGNOSTICS_SLEEP')
    AND wait_time_ms > 0
)
SELECT TOP 20 
  wait_type,
  waiting_tasks_count,
  wait_time_ms,
  resource_wait_time_ms,
  signal_wait_time_ms,
  CAST(pct AS DECIMAL(5,2)) AS pct
FROM WaitStats
ORDER BY wait_time_ms DESC;
```

### Clear Wait Stats (for fresh baseline)
```sql
DBCC SQLPERF('sys.dm_os_wait_stats', CLEAR);
```

## Query Store

### Enable Query Store
```sql
ALTER DATABASE YourDB SET QUERY_STORE = ON;
ALTER DATABASE YourDB SET QUERY_STORE (
  OPERATION_MODE = READ_WRITE,
  CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 30),
  DATA_FLUSH_INTERVAL_SECONDS = 900,
  MAX_STORAGE_SIZE_MB = 1024,
  INTERVAL_LENGTH_MINUTES = 60,
  SIZE_BASED_CLEANUP_MODE = AUTO,
  QUERY_CAPTURE_MODE = AUTO
);
```

### Find Regressed Queries
```sql
SELECT TOP 20
  q.query_id,
  qt.query_sql_text,
  rs.avg_duration / 1000 AS avg_duration_ms,
  rs.avg_cpu_time / 1000 AS avg_cpu_ms,
  rs.avg_logical_io_reads,
  rs.count_executions,
  p.plan_id,
  p.is_forced_plan
FROM sys.query_store_query q
JOIN sys.query_store_query_text qt ON q.query_text_id = qt.query_text_id
JOIN sys.query_store_plan p ON q.query_id = p.query_id
JOIN sys.query_store_runtime_stats rs ON p.plan_id = rs.plan_id
JOIN sys.query_store_runtime_stats_interval rsi ON rs.runtime_stats_interval_id = rsi.runtime_stats_interval_id
WHERE rsi.start_time > DATEADD(DAY, -7, GETDATE())
ORDER BY rs.avg_duration DESC;
```

### Force a Plan
```sql
EXEC sp_query_store_force_plan @query_id = 123, @plan_id = 456;

-- Unforce
EXEC sp_query_store_unforce_plan @query_id = 123, @plan_id = 456;
```