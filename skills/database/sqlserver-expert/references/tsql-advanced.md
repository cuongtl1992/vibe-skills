# T-SQL Advanced Patterns

## Table of Contents
1. [Window Functions](#window-functions)
2. [CTEs & Recursive CTEs](#ctes--recursive-ctes)
3. [MERGE Statement](#merge-statement)
4. [APPLY Operators](#apply-operators)
5. [JSON Operations](#json-operations)
6. [Temp Tables & Table Variables](#temp-tables--table-variables)

## Window Functions

### ROW_NUMBER, RANK, DENSE_RANK
```sql
SELECT 
  Id, Name, Department, Salary,
  ROW_NUMBER() OVER (PARTITION BY Department ORDER BY Salary DESC) AS RowNum,
  RANK() OVER (PARTITION BY Department ORDER BY Salary DESC) AS Rank,
  DENSE_RANK() OVER (PARTITION BY Department ORDER BY Salary DESC) AS DenseRank
FROM Employees;
```

### Running Totals & Moving Averages
```sql
SELECT 
  OrderDate, Amount,
  SUM(Amount) OVER (ORDER BY OrderDate ROWS UNBOUNDED PRECEDING) AS RunningTotal,
  AVG(Amount) OVER (ORDER BY OrderDate ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS MovingAvg7Day
FROM Orders;
```

### LAG & LEAD
```sql
SELECT 
  OrderDate, Amount,
  LAG(Amount, 1, 0) OVER (ORDER BY OrderDate) AS PrevAmount,
  LEAD(Amount, 1, 0) OVER (ORDER BY OrderDate) AS NextAmount,
  Amount - LAG(Amount, 1, 0) OVER (ORDER BY OrderDate) AS DayOverDay
FROM Orders;
```

### FIRST_VALUE & LAST_VALUE
```sql
SELECT 
  Department, Name, Salary,
  FIRST_VALUE(Name) OVER (PARTITION BY Department ORDER BY Salary DESC) AS TopEarner,
  LAST_VALUE(Name) OVER (PARTITION BY Department ORDER BY Salary DESC
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS LowestEarner
FROM Employees;
```

## CTEs & Recursive CTEs

### Basic CTE
```sql
WITH OrderSummary AS (
  SELECT CustomerId, COUNT(*) AS OrderCount, SUM(TotalAmount) AS TotalSpent
  FROM Orders
  GROUP BY CustomerId
)
SELECT c.Name, os.OrderCount, os.TotalSpent
FROM Customers c
JOIN OrderSummary os ON c.Id = os.CustomerId
WHERE os.TotalSpent > 10000;
```

### Multiple CTEs
```sql
WITH 
MonthlySales AS (
  SELECT YEAR(OrderDate) AS Year, MONTH(OrderDate) AS Month, SUM(Amount) AS Total
  FROM Orders GROUP BY YEAR(OrderDate), MONTH(OrderDate)
),
RankedMonths AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY Year ORDER BY Total DESC) AS Rank
  FROM MonthlySales
)
SELECT * FROM RankedMonths WHERE Rank <= 3;
```

### Recursive CTE (Hierarchy)
```sql
WITH OrgChart AS (
  -- Anchor: top-level managers
  SELECT Id, Name, ManagerId, 0 AS Level, CAST(Name AS NVARCHAR(MAX)) AS Path
  FROM Employees WHERE ManagerId IS NULL
  
  UNION ALL
  
  -- Recursive: employees under managers
  SELECT e.Id, e.Name, e.ManagerId, oc.Level + 1, oc.Path + ' > ' + e.Name
  FROM Employees e
  JOIN OrgChart oc ON e.ManagerId = oc.Id
)
SELECT * FROM OrgChart ORDER BY Path
OPTION (MAXRECURSION 100);
```

### Recursive CTE (Running Sequence)
```sql
WITH Numbers AS (
  SELECT 1 AS N
  UNION ALL
  SELECT N + 1 FROM Numbers WHERE N < 100
)
SELECT N FROM Numbers OPTION (MAXRECURSION 100);
```

## MERGE Statement

### Full MERGE with OUTPUT
```sql
DECLARE @Changes TABLE (Action NVARCHAR(10), Id INT, OldName NVARCHAR(100), NewName NVARCHAR(100));

MERGE INTO Products AS target
USING StagingProducts AS source ON target.SKU = source.SKU
WHEN MATCHED AND target.Price <> source.Price THEN
  UPDATE SET target.Price = source.Price, target.ModifiedAt = GETDATE()
WHEN NOT MATCHED BY TARGET THEN
  INSERT (SKU, Name, Price) VALUES (source.SKU, source.Name, source.Price)
WHEN NOT MATCHED BY SOURCE THEN
  DELETE
OUTPUT $action, inserted.Id, deleted.Name, inserted.Name INTO @Changes;

SELECT * FROM @Changes;
```

## APPLY Operators

### CROSS APPLY (Inner Join behavior)
```sql
-- Top 3 orders per customer
SELECT c.Name, o.OrderDate, o.TotalAmount
FROM Customers c
CROSS APPLY (
  SELECT TOP 3 * FROM Orders WHERE CustomerId = c.Id ORDER BY OrderDate DESC
) o;
```

### OUTER APPLY (Left Join behavior)
```sql
-- Latest order per customer (including customers with no orders)
SELECT c.Name, o.OrderDate, o.TotalAmount
FROM Customers c
OUTER APPLY (
  SELECT TOP 1 * FROM Orders WHERE CustomerId = c.Id ORDER BY OrderDate DESC
) o;
```

### APPLY with Table-Valued Function
```sql
-- Split comma-separated values
SELECT c.Name, s.value AS Tag
FROM Categories c
CROSS APPLY STRING_SPLIT(c.Tags, ',') s;
```

## JSON Operations

### Parse JSON
```sql
DECLARE @json NVARCHAR(MAX) = N'{"name":"John","age":30,"orders":[{"id":1},{"id":2}]}';

SELECT 
  JSON_VALUE(@json, '$.name') AS Name,
  JSON_VALUE(@json, '$.age') AS Age,
  JSON_QUERY(@json, '$.orders') AS Orders;
```

### Query JSON Array
```sql
SELECT Id, Name, JSON_VALUE(Metadata, '$.category') AS Category
FROM Products
WHERE ISJSON(Metadata) = 1
  AND JSON_VALUE(Metadata, '$.active') = 'true';

-- Expand JSON array
SELECT p.Id, o.value AS OrderId
FROM Products p
CROSS APPLY OPENJSON(p.OrderIds) o;
```

### Build JSON
```sql
SELECT Id, Name, Email,
  (SELECT OrderId, Amount FROM Orders WHERE CustomerId = c.Id FOR JSON PATH) AS Orders
FROM Customers c
FOR JSON PATH, ROOT('customers');
```

## Temp Tables & Table Variables

### Temp Table (prefer for large datasets)
```sql
CREATE TABLE #TempOrders (
  Id INT PRIMARY KEY,
  CustomerId INT INDEX IX_Customer,
  Amount DECIMAL(18,2)
);

INSERT INTO #TempOrders SELECT Id, CustomerId, Amount FROM Orders WHERE Year = 2024;
-- Use #TempOrders in queries
DROP TABLE #TempOrders;
```

### Table Variable (prefer for small datasets < 1000 rows)
```sql
DECLARE @OrderIds TABLE (Id INT PRIMARY KEY);
INSERT INTO @OrderIds SELECT Id FROM Orders WHERE Status = 'Pending';
```

### Memory-Optimized Table Variable
```sql
DECLARE @FastTable TABLE (
  Id INT PRIMARY KEY NONCLUSTERED,
  Value NVARCHAR(100)
) WITH (MEMORY_OPTIMIZED = ON);
```