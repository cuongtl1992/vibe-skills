# BDD Analysis Rules

Detailed rules for analyzing Playwright-BDD test quality.

---

## 1. Gherkin Quality Rules

### R1-1: Declarative Style

**Rule**: Scenarios describe WHAT happens, not HOW (UI implementation).

**Severity**: Medium

**Detection patterns**:
- UI element names: `button`, `field`, `input`, `dropdown`, `checkbox`
- UI actions: `click`, `enter`, `type`, `select`, `scroll`, `hover`
- CSS/XPath references in steps

**Examples**:

```gherkin
# ❌ Imperative - exposes UI implementation
When user enters "test@example.com" in username field
And user enters "password123" in password field  
And user clicks login button
Then user sees dashboard page

# ✅ Declarative - expresses business intent
When user logs in with valid credentials
Then dashboard is displayed
```

**Why it matters**:
- UI changes don't break scenarios
- Scenarios serve as living documentation
- Business stakeholders can read and validate

---

### R1-2: Scenario Independence

**Rule**: Each scenario MUST run independently without relying on other scenarios.

**Severity**: High

**Detection patterns**:
- "previous scenario", "after scenario X"
- Shared variables/state between scenarios
- Scenario execution order assumptions
- Missing `Given` preconditions

**Examples**:

```gherkin
# ❌ Dependent - second scenario needs first to run
Scenario: Create user
  When user "test@example.com" is created
  Then user exists

Scenario: Login with created user
  When user "test@example.com" logs in  # Assumes user exists!
  Then login succeeds

# ✅ Independent - each scenario sets up its own state
Scenario: Create user
  When user "test@example.com" is created
  Then user exists

Scenario: Login with existing user
  Given user "test@example.com" exists  # Explicit precondition
  When user "test@example.com" logs in
  Then login succeeds
```

**Why it matters**:
- Enables parallel execution
- Tests can run in any order
- Failures are isolated and debuggable

---

### R1-3: Background Usage

**Rule**: Common preconditions in 3+ scenarios should be extracted to Background.

**Severity**: Medium

**Detection patterns**:
- Same `Given` step appears in 3+ scenarios in same feature
- Copy-pasted preconditions

**Examples**:

```gherkin
# ❌ Repetitive - same preconditions repeated
Feature: Booking Management

Scenario: Create booking
  Given admin is logged in
  And admin is on booking page
  When admin creates booking
  Then booking is created

Scenario: Update booking
  Given admin is logged in
  And admin is on booking page
  When admin updates booking
  Then booking is updated

Scenario: Delete booking
  Given admin is logged in
  And admin is on booking page
  When admin deletes booking
  Then booking is deleted

# ✅ DRY - common preconditions in Background
Feature: Booking Management

Background:
  Given admin is logged in
  And admin is on booking page

Scenario: Create booking
  When admin creates booking
  Then booking is created

Scenario: Update booking
  When admin updates booking
  Then booking is updated

Scenario: Delete booking
  When admin deletes booking
  Then booking is deleted
```

**Why it matters**:
- Single point of change for common setup
- Scenarios focus on their unique behavior
- Improved readability

---

### R1-4: Scenario Outline for Data Variations

**Rule**: Similar scenarios differing only in test data should use Scenario Outline.

**Severity**: Medium

**Detection patterns**:
- 3+ scenarios with identical structure
- Only values differ between scenarios
- Copy-pasted scenario blocks

**Examples**:

```gherkin
# ❌ Duplicated - same structure, different data
Scenario: Invalid email shows error
  Given user is on registration form
  When user enters "invalid-email" in email field
  And user submits form
  Then error "Please enter valid email" is shown

Scenario: Invalid phone shows error
  Given user is on registration form
  When user enters "abc" in phone field
  And user submits form
  Then error "Please enter valid phone" is shown

Scenario: Empty name shows error
  Given user is on registration form
  When user leaves name field empty
  And user submits form
  Then error "Name is required" is shown

# ✅ Parameterized - single template, multiple data rows
Scenario Outline: Validation errors for invalid input
  Given user is on registration form
  When user enters "<value>" in <field> field
  And user submits form
  Then error "<message>" is shown

  Examples:
    | field | value         | message                  |
    | email | invalid-email | Please enter valid email |
    | phone | abc           | Please enter valid phone |
    | name  |               | Name is required         |
```

**Why it matters**:
- Easy to add new test cases (just add row)
- Logic changes in one place
- Clear view of all test variations

---

## 2. Coverage Rules

### R2-1: Happy Path Required

**Rule**: Every feature MUST have at least one happy path (success) scenario.

**Severity**: Critical

**Detection**: Feature file with no success scenario.

**Checklist**:
- [ ] Main user flow works end-to-end
- [ ] Expected outcome is verified
- [ ] All required fields/steps included

---

### R2-2: Error Path Required

**Rule**: Every feature MUST have error handling scenarios.

**Severity**: Critical

**Detection**: Feature file with only happy paths.

**Common error scenarios**:
- Invalid input validation
- Authentication failures
- Authorization denials
- Network/server errors
- Timeout handling
- Conflict resolution

---

### R2-3: Boundary Value Testing

**Rule**: Numeric inputs must have boundary value tests.

**Severity**: Medium

**Required test cases**:

| Boundary | Description | Example (count 1-10) |
|----------|-------------|---------------------|
| min - 1 | Below minimum | count = 0 |
| min | At minimum | count = 1 |
| min + 1 | Just above minimum | count = 2 |
| typical | Normal value | count = 5 |
| max - 1 | Just below maximum | count = 9 |
| max | At maximum | count = 10 |
| max + 1 | Above maximum | count = 11 |

**Examples**:

```gherkin
Scenario Outline: Booking count validation
  Given user is on booking form
  When user enters <count> for party size
  And user submits booking
  Then <result>

  Examples:
    | count | result                              |
    | 0     | error "At least 1 person required"  |
    | 1     | booking is created                  |
    | 10    | booking is created                  |
    | 11    | error "Maximum 10 people allowed"   |
    | -1    | error "At least 1 person required"  |
```

---

### R2-4: Authentication/Authorization Testing

**Rule**: Protected features must test all access levels.

**Severity**: Critical

**Required scenarios**:

| User Type | Expected Result |
|-----------|-----------------|
| Unauthenticated | Redirect to login |
| Authenticated, no permission | Access denied error |
| Authenticated, with permission | Access granted |
| Admin | Full access |

**Examples**:

```gherkin
@security
Scenario: Unauthenticated user redirected to login
  Given user is not logged in
  When user navigates to "/admin/settings"
  Then user is redirected to "/login"

@security
Scenario: Regular user cannot access admin
  Given user is logged in as "regular-user"
  When user navigates to "/admin/settings"
  Then error "Access denied" is shown

@security
Scenario: Admin can access settings
  Given user is logged in as "admin"
  When user navigates to "/admin/settings"
  Then settings page is displayed
```

---

### R2-5: Multi-tenant Isolation

**Rule**: Multi-tenant systems MUST verify data isolation.

**Severity**: Critical (for multi-tenant systems)

**Required scenarios**:

```gherkin
@security @multi-tenant
Scenario: Tenant A cannot see Tenant B data
  Given user is logged in as Tenant A admin
  And booking exists for Tenant B
  When user views booking list
  Then Tenant B booking is not visible
  And only Tenant A bookings are shown

@security @multi-tenant
Scenario: Tenant A cannot modify Tenant B data
  Given user is logged in as Tenant A admin
  And booking "B-123" exists for Tenant B
  When user attempts to update booking "B-123"
  Then error "Booking not found" is shown
  And booking "B-123" is unchanged
```

---

## 3. Step Definition Rules

### R3-1: Step Reuse Rate

**Rule**: At least 60% of step definitions should be used multiple times.

**Severity**: Medium

**Calculation**:
```
Reuse Rate = (Steps used 2+ times) / (Total step definitions) × 100%
```

**Targets**:
| Rate | Rating |
|------|--------|
| ≥80% | Excellent |
| 60-79% | Good |
| 40-59% | Fair |
| <40% | Needs improvement |

---

### R3-2: No Duplicate Steps

**Rule**: Steps with same meaning should be consolidated.

**Severity**: Low

**Detection patterns**:
```typescript
// Duplicates - same meaning, different wording
When('user navigates to {string}', ...)
When('user goes to {string}', ...)
When('user visits {string}', ...)

// Should consolidate to one
When('user navigates to {string}', ...)
```

---

### R3-3: Parameterization

**Rule**: Similar steps should be parameterized.

**Severity**: Medium

**Examples**:

```typescript
// ❌ Before - multiple similar steps
When('user navigates to login page', async ({ page }) => {
  await page.goto('/login');
});

When('user navigates to dashboard', async ({ page }) => {
  await page.goto('/dashboard');
});

When('user navigates to settings', async ({ page }) => {
  await page.goto('/settings');
});

// ✅ After - single parameterized step
When('user navigates to {string}', async ({ page }, path: string) => {
  await page.goto(path);
});
```

---

## 4. Execution Stability Rules

### R4-1: No Fixed Timeouts

**Rule**: Never use `waitForTimeout()` with fixed duration.

**Severity**: High

**Detection**: Any use of `page.waitForTimeout(N)` or `setTimeout`.

**Fix patterns**:

```typescript
// ❌ Flaky - arbitrary wait
await page.waitForTimeout(2000);
const text = await page.locator('.result').textContent();

// ✅ Stable - wait for condition
await page.waitForSelector('.result');
const text = await page.locator('.result').textContent();

// ✅ Stable - wait for network
await page.waitForLoadState('networkidle');

// ✅ Stable - wait for specific response
await page.waitForResponse(resp => 
  resp.url().includes('/api/data') && resp.status() === 200
);
```

---

### R4-2: Use Test IDs

**Rule**: Use `data-testid` attributes instead of text or CSS selectors.

**Severity**: Medium

**Detection**: Selectors using `:has-text()`, text content, or complex CSS.

**Fix patterns**:

```typescript
// ❌ Brittle - text changes break test
await page.click('button:has-text("Submit")');
await page.click('text=Submit');

// ❌ Brittle - CSS changes break test
await page.click('.btn.btn-primary.submit-btn');

// ✅ Stable - dedicated test attribute
await page.click('[data-testid="submit-button"]');
```

**Component update**:
```tsx
// Add data-testid to components
<button data-testid="submit-button" className="btn btn-primary">
  Submit
</button>
```

---

### R4-3: No Nested Waits

**Rule**: Avoid multiple sequential waits.

**Severity**: High

**Detection**: Multiple `waitFor*` calls in sequence.

**Fix patterns**:

```typescript
// ❌ Flaky - multiple sequential waits
await page.waitForTimeout(1000);
await page.waitForSelector('.loading');
await page.waitForTimeout(2000);
await page.waitForSelector('.result');

// ✅ Stable - single specific wait
await page.waitForSelector('.loading', { state: 'detached' });
await expect(page.locator('.result')).toBeVisible();
```

---

## 5. Tagging Rules

### R5-1: Tag Coverage

**Rule**: Every scenario should have at least one meaningful tag.

**Severity**: Low

**Recommended tags**:

| Tag | Purpose |
|-----|---------|
| `@smoke` | Critical path tests |
| `@regression` | Full regression suite |
| `@api` | API-focused tests |
| `@ui` | UI interaction tests |
| `@security` | Security tests |
| `@performance` | Performance tests |
| `@slow` | Long-running tests |
| `@flaky` | Known flaky (temporary) |
| `@wip` | Work in progress |

---

### R5-2: Tag Consistency

**Rule**: Tags should follow consistent naming convention.

**Severity**: Low

**Detection**:
- Mixed case: `@Smoke` vs `@smoke`
- Synonyms: `@smoke` vs `@smoke-test` vs `@smokeTest`

**Convention**: lowercase, hyphen-separated
```gherkin
@smoke           # ✅
@api-integration # ✅
@SMOKE           # ❌
@smokeTest       # ❌
```

---

## 6. Security Rules

### R6-1: XSS Prevention

**Rule**: User input fields must have XSS prevention tests.

**Severity**: Critical

```gherkin
@security
Scenario: XSS script tags are sanitized
  When user enters "<script>alert('xss')</script>" in name field
  And form is submitted
  Then input is sanitized
  And script is not executed on display

@security
Scenario: XSS event handlers are sanitized
  When user enters "<img src=x onerror=alert('xss')>" in comment field
  And form is submitted
  Then input is sanitized
  And no JavaScript executes
```

---

### R6-2: Authentication Bypass

**Rule**: Protected routes must have bypass prevention tests.

**Severity**: Critical

```gherkin
@security
Scenario: Direct URL access requires authentication
  Given user is not logged in
  When user directly navigates to "/admin/users"
  Then user is redirected to "/login"
  And admin page is not accessible

@security
Scenario: Expired session requires re-authentication
  Given user session has expired
  When user attempts to access "/dashboard"
  Then user is redirected to "/login"
  And session data is cleared
```

---

## Scoring System

### Score Calculation

```
Total Score = Σ(Rule Score × Weight) / Σ(Weight) × 100
```

### Weights by Severity

| Severity | Weight | Rules |
|----------|--------|-------|
| Critical | 10 | R2-1, R2-2, R2-4, R2-5, R6-1, R6-2 |
| High | 8 | R1-2, R4-1, R4-3 |
| Medium | 5 | R1-1, R1-3, R1-4, R2-3, R3-1, R3-3, R4-2 |
| Low | 2 | R3-2, R5-1, R5-2 |

### Grade Scale

| Score | Grade | Description |
|-------|-------|-------------|
| 90-100 | A | Excellent - production ready |
| 80-89 | B | Good - minor improvements needed |
| 70-79 | C | Fair - significant improvements needed |
| 60-69 | D | Poor - major issues |
| <60 | F | Failing - critical issues |
