# BDD Improvement Patterns

Common problems and their solutions for improving BDD test quality.

---

## Pattern 1: Imperative to Declarative

### Problem

UI implementation details exposed in Gherkin scenarios. When UI changes, scenarios break.

### Before (Imperative)

```gherkin
Scenario: User logs in
  Given user is on "/login" page
  When user enters "test@example.com" in email field
  And user enters "password123" in password field
  And user clicks "Login" button
  Then user is redirected to "/" page
```

### After (Declarative)

```gherkin
Scenario: User logs in successfully
  Given user is on login page
  When user logs in with valid credentials
  Then dashboard is displayed
```

### Implementation

```typescript
// Step definition hides UI details
When('user logs in with valid credentials', async ({ page }) => {
  await page.fill('[data-testid="email-input"]', 'test@example.com');
  await page.fill('[data-testid="password-input"]', 'password123');
  await page.click('[data-testid="login-button"]');
});
```

### Benefits

- UI changes don't break scenarios
- Scenarios readable by non-technical stakeholders
- Better documentation of business intent

---

## Pattern 2: Extract Background

### Problem

Same preconditions repeated across multiple scenarios.

### Before

```gherkin
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
```

### After

```gherkin
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

### Benefits

- DRY principle applied
- Single point of change for setup
- Scenarios focus on unique behavior

---

## Pattern 3: Use Scenario Outline

### Problem

Multiple similar scenarios that differ only in test data.

### Before

```gherkin
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

Scenario: Empty required field shows error
  Given user is on registration form
  When user leaves name field empty
  And user submits form
  Then error "Name is required" is shown
```

### After

```gherkin
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

### Benefits

- Easy to add new test cases
- Single logic definition
- Clear view of all test variations
- Reduced maintenance

---

## Pattern 4: Parameterize Step Definitions

### Problem

Multiple step definitions with same logic, different hardcoded values.

### Before

```typescript
When('user navigates to login page', async ({ page }) => {
  await page.goto('/login');
});

When('user navigates to dashboard', async ({ page }) => {
  await page.goto('/dashboard');
});

When('user navigates to settings', async ({ page }) => {
  await page.goto('/settings');
});
```

### After

```typescript
When('user navigates to {string}', async ({ page }, path: string) => {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
});
```

### Updated Gherkin

```gherkin
When user navigates to "/login"
When user navigates to "/dashboard"
When user navigates to "/settings"
```

### Benefits

- Single step definition to maintain
- Flexible for any path
- Consistent behavior across all navigation

---

## Pattern 5: Fix Flaky Waits

### Problem

Fixed timeout waits cause flaky tests - too short fails, too long wastes time.

### Before (Flaky)

```typescript
Then('booking is created', async ({ page }) => {
  await page.click('[data-testid="submit-booking"]');
  await page.waitForTimeout(2000); // ❌ Arbitrary wait
  const message = await page.locator('[data-testid="success-message"]');
  await expect(message).toHaveText('Booking created');
});
```

### After (Stable)

```typescript
Then('booking is created', async ({ page }) => {
  await page.click('[data-testid="submit-booking"]');
  
  // ✅ Wait for specific condition
  const message = page.locator('[data-testid="success-message"]');
  await message.waitFor({ state: 'visible' });
  await expect(message).toHaveText('Booking created');
});
```

### Alternative Patterns

```typescript
// Wait for network to settle
await page.waitForLoadState('networkidle');

// Wait for specific API response
await page.waitForResponse(
  response => response.url().includes('/api/booking') && response.status() === 201
);

// Wait for element state
await page.locator('.loading').waitFor({ state: 'detached' });

// Playwright's auto-waiting assertions
await expect(page.locator('.result')).toBeVisible();
await expect(page.locator('.count')).toHaveText('5');
```

### Benefits

- Tests run as fast as possible
- No arbitrary delays
- More reliable results

---

## Pattern 6: Use Test IDs

### Problem

Text or CSS selectors break when UI text or styling changes.

### Before (Brittle)

```typescript
// Text selector - breaks if button text changes
await page.click('button:has-text("Submit Booking")');

// CSS selector - breaks if styling changes
await page.click('.btn.btn-primary.booking-submit');

// Text content - breaks with i18n
await page.locator('text=Submit').click();
```

### After (Stable)

```typescript
// Test ID - stable regardless of UI changes
await page.click('[data-testid="submit-booking"]');
```

### Component Update

```tsx
// Add data-testid to components
<button 
  data-testid="submit-booking"
  className="btn btn-primary"
>
  {t('booking.submit')} {/* i18n text can change */}
</button>
```

### Naming Convention

```
data-testid="[feature]-[element]-[action/type]"

Examples:
- data-testid="login-email-input"
- data-testid="booking-submit-button"
- data-testid="user-menu-dropdown"
- data-testid="error-message-alert"
```

### Benefits

- Resilient to UI changes
- Works with any language (i18n)
- Clear test intent
- Easy to locate in code

---

## Pattern 7: Ensure Independence

### Problem

Scenarios depend on execution order or shared state.

### Before (Dependent)

```gherkin
Scenario: Create user
  When user "test@example.com" is created
  Then user exists in database

Scenario: Login with created user
  # ❌ Depends on previous scenario running first!
  When user "test@example.com" logs in
  Then login succeeds
```

### After (Independent)

```gherkin
Scenario: Create user
  When user "test@example.com" is created
  Then user exists in database

Scenario: Login with existing user
  Given user "test@example.com" exists  # ✅ Explicit setup
  When user "test@example.com" logs in
  Then login succeeds
```

### Step Definition

```typescript
Given('user {string} exists', async ({ page }, email: string) => {
  // Create user via API or database seed
  await apiClient.createUser({ email, password: 'test123' });
});
```

### Benefits

- Tests can run in parallel
- Tests can run in any order
- Failures are isolated
- Easier debugging

---

## Pattern 8: Add Boundary Tests

### Problem

Only happy path tested, edge cases missed.

### Before (Incomplete)

```gherkin
Feature: Booking Creation

Scenario: Create booking with valid data
  Given user is on booking form
  When user enters 4 for party size
  And user submits booking
  Then booking is created
```

### After (Complete)

```gherkin
Feature: Booking Creation

Scenario: Create booking with valid data
  Given user is on booking form
  When user enters 4 for party size
  And user submits booking
  Then booking is created

Scenario Outline: Booking validation for party size
  Given user is on booking form
  When user enters <size> for party size
  And user submits booking
  Then <result>

  Examples: Valid sizes
    | size | result              |
    | 1    | booking is created  |
    | 10   | booking is created  |

  Examples: Invalid sizes
    | size | result                                    |
    | 0    | error "At least 1 person required" shown  |
    | -1   | error "At least 1 person required" shown  |
    | 11   | error "Maximum 10 people allowed" shown   |
```

### Boundary Test Checklist

| Input Type | Test Cases |
|------------|------------|
| Numeric | min-1, min, mid, max, max+1, negative |
| String | empty, min length, max length, max+1 |
| Date | past, today, future, invalid format |
| List | empty, single, multiple, max items |

### Benefits

- Catch edge case bugs
- Document system limits
- Better specification

---

## Pattern 9: Add Security Tests

### Problem

No verification of security controls.

### Before (Insecure)

```gherkin
Feature: User Profile

Scenario: Update profile
  Given user is logged in
  When user updates their name
  Then profile is updated
```

### After (Secure)

```gherkin
Feature: User Profile

Scenario: Update profile
  Given user is logged in
  When user updates their name
  Then profile is updated

@security
Scenario: XSS prevention in profile name
  Given user is logged in
  When user enters "<script>alert('xss')</script>" as name
  And user saves profile
  Then name is sanitized
  And script does not execute on profile page

@security
Scenario: Cannot update other user's profile
  Given user A is logged in
  And user B exists
  When user A attempts to update user B profile
  Then error "Access denied" is shown
  And user B profile is unchanged

@security
Scenario: Profile update requires authentication
  Given user is not logged in
  When user attempts to update profile via API
  Then response status is 401
  And profile is unchanged
```

### Security Test Categories

| Category | Tests |
|----------|-------|
| XSS | Script tags, event handlers, encoded chars |
| CSRF | Missing tokens, invalid tokens |
| AuthN | Unauthenticated access, expired sessions |
| AuthZ | Wrong user access, role violations |
| Injection | SQL injection, command injection |
| Data | Other user data, other tenant data |

### Benefits

- Prevent security vulnerabilities
- Document security requirements
- Compliance evidence

---

## Pattern 10: Specific Error Messages

### Problem

Vague error assertions don't verify correct behavior.

### Before (Vague)

```gherkin
Then an error is shown
Then form validation fails
Then request is rejected
```

### After (Specific)

```gherkin
Then error "Email address is already registered" is shown
Then validation error "Password must be at least 8 characters" appears
Then API returns 409 Conflict with message "Duplicate entry"
```

### Step Definition

```typescript
Then('error {string} is shown', async ({ page }, expectedMessage: string) => {
  const error = page.locator('[data-testid="error-message"]');
  await expect(error).toBeVisible();
  await expect(error).toHaveText(expectedMessage);
});
```

### Benefits

- Verifies correct error shown
- Documents expected messages
- Catches wrong error bugs

---

## Pattern 11: Use Data Tables

### Problem

Multiple assertions make scenarios verbose.

### Before (Verbose)

```gherkin
Then booking details page is displayed
And customer name is "John Doe"
And email is "john@example.com"
And phone is "555-0123"
And date is "2026-01-15"
And time is "18:00"
And party size is "4"
```

### After (Concise)

```gherkin
Then booking details are displayed:
  | Field         | Value            |
  | Customer Name | John Doe         |
  | Email         | john@example.com |
  | Phone         | 555-0123         |
  | Date          | 2026-01-15       |
  | Time          | 18:00            |
  | Party Size    | 4                |
```

### Step Definition

```typescript
import { DataTable } from '@cucumber/cucumber';

Then('booking details are displayed:', async ({ page }, dataTable: DataTable) => {
  const rows = dataTable.rows();
  
  for (const [field, expectedValue] of rows) {
    const selector = `[data-testid="booking-${field.toLowerCase().replace(' ', '-')}"]`;
    await expect(page.locator(selector)).toHaveText(expectedValue);
  }
});
```

### Benefits

- Compact readable format
- Easy to add/remove fields
- Single step definition handles all

---

## Pattern 12: Multi-tenant Isolation

### Problem

No verification that tenant data is properly isolated.

### Before (Risky)

```gherkin
Feature: Booking List

Scenario: View all bookings
  Given admin is logged in
  When admin views booking list
  Then bookings are displayed
```

### After (Secure)

```gherkin
Feature: Booking List

Scenario: View own tenant bookings
  Given admin is logged in to Tenant A
  When admin views booking list
  Then only Tenant A bookings are displayed

@security @multi-tenant
Scenario: Cannot see other tenant bookings
  Given admin is logged in to Tenant A
  And booking exists for Tenant B
  When admin views booking list
  Then Tenant B booking is not visible

@security @multi-tenant
Scenario: Cannot access other tenant booking by ID
  Given admin is logged in to Tenant A
  And booking "B-123" exists for Tenant B
  When admin navigates to booking "B-123" detail page
  Then error "Booking not found" is shown
  And no Tenant B data is exposed

@security @multi-tenant
Scenario: Cannot modify other tenant booking
  Given admin is logged in to Tenant A
  And booking "B-123" exists for Tenant B
  When admin attempts to update booking "B-123" via API
  Then response status is 404
  And booking "B-123" is unchanged
```

### Benefits

- Prevent data leaks between tenants
- Verify isolation at multiple levels
- Compliance with data protection

---

## Improvement Process

### Step 1: Identify Issues

Run analysis tools to detect:
- Imperative scenarios
- Duplicate steps
- Flaky patterns
- Coverage gaps

### Step 2: Prioritize

| Priority | Issue Type | Rationale |
|----------|-----------|-----------|
| 🔴 Critical | Security gaps | Risk exposure |
| 🔴 Critical | Flaky tests | CI reliability |
| 🟡 High | Missing error paths | Bug escape risk |
| 🟡 High | Dependent scenarios | Test reliability |
| 🟢 Medium | Boundary gaps | Edge case bugs |
| 🟢 Medium | Imperative style | Maintainability |
| ⚪ Low | Background extraction | Code cleanliness |

### Step 3: Incremental Improvement

**Weekly**:
- Review new scenarios in PRs
- Fix any flaky tests immediately

**Sprint**:
- Address 2-3 high priority items
- Add missing security tests

**Quarterly**:
- Full quality audit
- Technical debt cleanup
- Update targets based on progress

### Step 4: Track Progress

```
Sprint 1: Score 65 (D)
Sprint 2: Score 72 (C) +7
Sprint 3: Score 78 (C) +6
Sprint 4: Score 85 (B) +7
```

---

## Quick Reference

| Pattern | When to Use | Effort |
|---------|-------------|--------|
| Declarative style | UI details in scenarios | Medium |
| Extract Background | 3+ repeated Given steps | Low |
| Scenario Outline | 3+ similar scenarios | Low |
| Parameterize steps | Duplicate step defs | Low |
| Fix flaky waits | Any waitForTimeout | Low |
| Use test IDs | Text/CSS selectors | Medium |
| Ensure independence | Shared state issues | Medium |
| Boundary tests | Numeric inputs | Medium |
| Security tests | User inputs, auth | High |
| Specific errors | Vague assertions | Low |
| Data tables | Many assertions | Low |
| Tenant isolation | Multi-tenant systems | High |
