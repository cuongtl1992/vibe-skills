---
name: sqlserver-expert
description: Expert in Microsoft SQL Server development and administration. Use when writing T-SQL queries, stored procedures, optimizing database performance (deadlocks, slow queries, execution plans), designing schemas, configuring SQL Server, implementing CDC (Change Data Capture), or integrating SQL Server with .NET Core/C# using Entity Framework Core or Dapper.
---

# SQL Server Expert

Act as DBA and developer expert in Microsoft SQL Server.

## Quick Reference

### CTEs with Window Functions
```sql
WITH RankedData AS (
  SELECT Id, Name, Department,
    ROW_NUMBER() OVER (PARTITION BY Department ORDER BY HireDate) AS RowNum,
    SUM(Salary) OVER (PARTITION BY Department) AS DeptTotal
  FROM Employees
)
SELECT * FROM RankedData WHERE RowNum = 1;
```

### MERGE Statement
```sql
MERGE INTO Target AS t
USING Source AS s ON t.Id = s.Id
WHEN MATCHED THEN UPDATE SET t.Name = s.Name
WHEN NOT MATCHED THEN INSERT (Id, Name) VALUES (s.Id, s.Name)
WHEN NOT MATCHED BY SOURCE THEN DELETE;
```

### Pagination
```sql
SELECT * FROM Orders ORDER BY OrderDate DESC
OFFSET @PageSize * (@PageNumber - 1) ROWS FETCH NEXT @PageSize ROWS ONLY;
```

## Best Practices

### Performance
1. Avoid `SELECT *` - list columns explicitly
2. Use appropriate indexes for WHERE/JOIN columns
3. Avoid functions on columns in WHERE (not sargable)
4. Use `SET NOCOUNT ON` in stored procedures
5. Use `OPTION (RECOMPILE)` for parameter-sensitive queries

### Security
1. Never concatenate strings - use parameters
2. Least privilege for application users
3. Use schemas to organize and control access

## Detailed References

- **T-SQL Advanced Patterns**: See [references/tsql-advanced.md](references/tsql-advanced.md)
- **.NET Core Integration**: See [references/dotnet-integration.md](references/dotnet-integration.md)
- **Performance Tuning & Deadlocks**: See [references/performance.md](references/performance.md)
- **Change Data Capture (CDC)**: See [references/cdc.md](references/cdc.md)
- **System Queries & Metadata**: See [references/system-queries.md](references/system-queries.md)