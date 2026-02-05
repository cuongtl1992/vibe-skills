---
name: code-reviewer
description: Systematic code review for quality, correctness, and maintainability. Use when reviewing pull requests, code changes, diffs, or when asked to review/critique code. Covers functionality, architecture, performance, security, testing, and documentation with structured feedback using priority prefixes.
---

# Code Reviewer

Systematic approach to reviewing code changes.

## Review Process

1. **Understand context** - Read PR description, linked issues, related files
2. **Review by area** 
    - Apply relevant checklists, common checklists from [references/common_checklists.md](references/common_checklists.md). 
    - For Flutter/Dart changes, use [references/flutter_dart_checklist.md](references/flutter_dart_checklist.md).
    - For Android/Kotlin changes, use [references/android_checklists.md](references/android_checklists.md).
3. **Provide feedback** - Use comment format below

## Comment Format

Use prefixes to indicate priority:

| Prefix | Meaning | Action |
|--------|---------|--------|
| `[BLOCKING]` | Must fix before merge | Required |
| `[SUGGESTION]` | Improvement opportunity | Optional |
| `[QUESTION]` | Need clarification | Response needed |
| `[NIT]` | Minor style issue | Optional |

**Comment structure:**
```
[PREFIX] Brief issue description

Why: Explanation of the problem or risk
Fix: Suggested solution or alternative
```

**Example:**
```
[BLOCKING] SQL injection vulnerability in user search

Why: User input concatenated directly into query string
Fix: Use parameterized query

// Before
var sql = $"SELECT * FROM Users WHERE Name = '{input}'";

// After  
var sql = "SELECT * FROM Users WHERE Name = @name";
cmd.Parameters.AddWithValue("@name", input);
```

## Feedback Principles

- Point to exact lines with specific alternatives
- Explain *why* something is problematic
- Focus on code, not the author
- Acknowledge good patterns when found
