# Playwright-BDD Analyzer

> Analyze and improve Playwright-BDD/Cucumber test quality, coverage, and maintainability.

## When to Use

- Reviewing `.feature` files for quality issues
- Analyzing step definition reusability
- Checking scenario coverage gaps
- Evaluating E2E test execution results
- Assessing test maintainability

---

## Quick Reference

### Quality Targets

| Metric | Target | Priority |
|--------|--------|----------|
| Step Reuse Rate | ≥60% | Medium |
| Declarative Scenario Rate | ≥80% | Medium |
| Scenario Independence | 100% | High |
| Happy Path Coverage | 100% | Critical |
| Error Path Coverage | 100% | Critical |
| Boundary Value Coverage | ≥80% | Medium |
| Security Test Coverage | 100% | Critical |
| Tag Coverage | ≥90% | Low |
| Flaky Test Rate | 0% | High |

### Declarative vs Imperative Style

```gherkin
# ❌ IMPERATIVE (avoid) - UI details exposed
When user enters "test@example.com" in email field
And user enters "password123" in password field
And user clicks login button

# ✅ DECLARATIVE (preferred) - business intent clear
When user logs in with valid credentials
```

### Flaky Patterns to Avoid

```typescript
// ❌ Fixed timeout - flaky
await page.waitForTimeout(2000);

// ✅ Explicit wait - stable
await page.waitForSelector('[data-testid="result"]');

// ❌ Text selector - brittle
await page.click('button:has-text("Submit")');

// ✅ Test ID selector - stable
await page.click('[data-testid="submit-button"]');
```

---

## Analysis Checklist

### 1. Gherkin Quality

- [ ] Scenarios use declarative style (no UI details)
- [ ] Each scenario is independent (can run alone)
- [ ] Background extracts common preconditions
- [ ] Scenario Outline used for similar test cases
- [ ] Steps are parameterized where possible

### 2. Coverage Completeness

For each feature, verify:

- [ ] **Happy Path** - Normal flow works
- [ ] **Error Path** - Error handling works
- [ ] **Boundary Values** - Edge cases covered
- [ ] **Auth/AuthZ** - Permission checks work
- [ ] **Loading/Error States** - UI states handled
- [ ] **Concurrency** - Race conditions handled
- [ ] **Security** - XSS/CSRF/injection prevented

### 3. Step Definition Quality

- [ ] Reuse rate ≥60%
- [ ] No duplicate steps with different wording
- [ ] Parameters used instead of hardcoded values
- [ ] Page Object pattern for UI interactions

### 4. Execution Stability

- [ ] No `waitForTimeout()` usage
- [ ] No text-based selectors
- [ ] No scenario order dependencies
- [ ] No shared mutable state between scenarios

---

## Analysis Rules

### R1: Declarative Style

**Rule**: Scenarios describe WHAT happens, not HOW.

**Detection**: Steps containing UI keywords:
- `click`, `enter`, `input`, `select`, `field`, `button`, `dropdown`

**Fix**: Move UI details to step definitions, expose business intent.

```gherkin
# Before
When user clicks "Add to Cart" button
And user enters "2" in quantity field

# After  
When user adds 2 items to cart
```

### R2: Scenario Independence

**Rule**: Each scenario must run alone without depending on others.

**Detection**: 
- References to "previous scenario"
- Shared state between scenarios
- Execution order assumptions

**Fix**: Use `Given` to establish preconditions explicitly.

```gherkin
# Before - depends on previous scenario
Scenario: Login with created user
  When user "test@example.com" logs in

# After - independent
Scenario: Login with existing user
  Given user "test@example.com" exists
  When user "test@example.com" logs in
```

### R3: Background Usage

**Rule**: Common preconditions shared by 3+ scenarios should use Background.

**Detection**: Same `Given` step repeated in multiple scenarios.

```gherkin
# Before - repetition
Scenario: Create booking
  Given admin is logged in
  When admin creates booking

Scenario: Update booking
  Given admin is logged in
  When admin updates booking

# After - DRY
Background:
  Given admin is logged in

Scenario: Create booking
  When admin creates booking

Scenario: Update booking
  When admin updates booking
```

### R4: Scenario Outline

**Rule**: Similar scenarios differing only in data should use Scenario Outline.

**Detection**: 3+ scenarios with identical structure, different values.

```gherkin
# Before - duplication
Scenario: Invalid email shows error
  When user enters "invalid" in email
  Then error "Invalid email format" is shown

Scenario: Invalid phone shows error
  When user enters "abc" in phone
  Then error "Invalid phone format" is shown

# After - parameterized
Scenario Outline: Invalid input shows validation error
  When user enters "<value>" in <field>
  Then error "<message>" is shown

  Examples:
    | field | value   | message              |
    | email | invalid | Invalid email format |
    | phone | abc     | Invalid phone format |
```

### R5: Flaky Pattern Detection

**Patterns to flag**:

| Pattern | Risk | Fix |
|---------|------|-----|
| `waitForTimeout(N)` | High | Use `waitForSelector` or `waitForLoadState` |
| `page.click('text=...')` | Medium | Use `data-testid` attribute |
| `page.locator('.class')` | Medium | Use `data-testid` for test elements |
| Nested waits | High | Single explicit wait condition |
| `Math.random()` in tests | High | Use deterministic test data |

### R6: Security Test Coverage

**Required tests for user input**:

```gherkin
@security
Scenario: XSS attack is prevented
  When user enters "<script>alert('xss')</script>" in name field
  And user submits form
  Then script is not executed
  And sanitized text is stored

@security
Scenario: Unauthenticated user cannot access admin
  Given user is not logged in
  When user navigates to "/admin/dashboard"
  Then user is redirected to "/login"

@security
Scenario: User cannot access other tenant data
  Given user belongs to Tenant A
  And booking exists in Tenant B
  When user views booking list
  Then Tenant B booking is not visible
```

---

## Output Format

### Summary Report

```markdown
# BDD Quality Report

Generated: 2026-01-06 10:00:00

## Summary

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Total Features | 12 | - | - |
| Total Scenarios | 87 | - | - |
| Step Reuse Rate | 68% | 60% | ✅ |
| Declarative Rate | 75% | 80% | ⚠️ |
| Tag Coverage | 95% | 90% | ✅ |
| Flaky Patterns | 3 | 0 | ⚠️ |

## Quality Score: 78/100

### Strengths ✅
1. High step reuse rate (68%)
2. Good tag coverage (95%)
3. Background used appropriately

### Issues ⚠️
1. Imperative scenarios (25%)
   - 📁 features/admin/dashboard.feature (5/7 scenarios)
   - Fix: Move UI details to step definitions

2. Missing boundary tests
   - 📁 features/booking/create.feature
   - Fix: Add cases for count=0, count=11

3. Flaky patterns detected
   - 📁 src/tests/e2e/booking.spec.ts:42
   - Fix: Replace waitForTimeout with waitForSelector
```

### Improvement Plan

```markdown
## Priority: High 🔴

1. **Fix flaky tests** (15 min)
   - File: src/tests/e2e/booking.spec.ts
   - Issue: waitForTimeout(2000)
   - Fix: await page.waitForSelector('[data-testid="success"]')

2. **Add security tests** (30 min)
   - Feature: booking/create
   - Missing: XSS prevention test

## Priority: Medium 🟡

3. **Add boundary tests** (30 min)
   - Feature: booking/create
   - Missing: count=0, count=11 cases

4. **Refactor to declarative** (2 hours)
   - 22 imperative scenarios
   - Biggest impact: features/admin/*.feature

## Priority: Low 🟢

5. **Consolidate duplicate steps** (20 min)
   - 3 duplicate step definitions found
```

---

## Scripts

### analyze-features.ts

Analyzes all `.feature` files and generates quality report.

```bash
npx ts-node scripts/analyze-features.ts [features-dir]
```

**Output**: `bdd-quality-report.md`

### check-step-coverage.ts

Checks step definition usage and detects duplicates.

```bash
npx ts-node scripts/check-step-coverage.ts [features-dir] [steps-dir]
```

### detect-flaky-patterns.ts

Scans test files for patterns that cause flaky tests.

```bash
npx ts-node scripts/detect-flaky-patterns.ts [tests-dir]
```

---

## CI/CD Integration

```yaml
# .github/workflows/bdd-quality.yml
name: BDD Quality Check

on:
  pull_request:
  schedule:
    - cron: '0 0 * * 0' # Weekly

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Analyze BDD Tests
        run: npx ts-node scripts/analyze-features.ts
        
      - name: Check for flaky patterns
        run: npx ts-node scripts/detect-flaky-patterns.ts
        
      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: bdd-quality-report
          path: bdd-quality-report.md
          
      - name: Comment PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('bdd-quality-report.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report
            });
```

---

## Usage Examples

**Full analysis:**
```
Analyze the Playwright-BDD test quality for this project
```

**Review specific feature:**
```
Review features/booking/create-reservation.feature for quality issues
```

**Find coverage gaps:**
```
Identify test coverage gaps and suggest improvements
```

**Fix flaky tests:**
```
Find and fix flaky test patterns in the E2E tests
```

---

## References

- [analysis-rules.md](references/analysis-rules.md) - Detailed analysis rules
- [quality-metrics.md](references/quality-metrics.md) - Metric definitions
- [improvement-patterns.md](references/improvement-patterns.md) - Common fixes
