# Selector Strategies

> Best practices for choosing stable, maintainable selectors.

## Priority Order

| Priority | Type | Example | Stability |
|----------|------|---------|-----------|
| 1 | **ID** | `#username` | Highest |
| 2 | **data-testid** | `[data-testid="username"]` | High |
| 3 | **name** | `[name="username"]` | High |
| 4 | **aria-label** | `[aria-label="Username"]` | Medium |
| 5 | **Dual selector** | `#id, [name="name"]` | High (fallback) |

---

## Good Patterns

```typescript
// ID - most stable
'#username'

// data-testid - dedicated for testing
'[data-testid="login-button"]'

// name attribute - good for forms
'[name="email"]'

// Dual selector - fallback pattern
'#username, [name="username"]'
```

## Anti-Patterns (Avoid)

```typescript
// Text-based - changes with i18n
'button:has-text("Login")'

// Dynamic classes
'.MuiButton-root-xyz123'

// Long CSS paths
'div.container > section > form > input'

// Positional
'ul li:nth-child(2)'
```

---

## Examples by Element Type

### Form Inputs
```typescript
username: '#username, [name="username"]'
password: '#password, [name="password"]'
email: 'input[type="email"], [name="email"]'
```

### Buttons
```typescript
submit: '#btn-submit, button[type="submit"]'
cancel: '[data-testid="cancel-btn"]'
```

### Feedback
```typescript
errorMessage: '#error, .error-message, [role="alert"]'
```
