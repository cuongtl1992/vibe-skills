---
name: pom-generator
description: Interactive Page Object Model generator using Playwright MCP - navigates to web pages, analyzes HTML structure, and generates TypeScript POM classes with BasePage pattern.
---

# POM Generator Skill

> Automatically generate Page Object Model classes by analyzing live web pages using Playwright MCP.

## When to Use

- Creating a new Page Object for a web page
- Analyzing page elements to identify selectors
- Generating POM code following best practices
- Setting up POM structure for a new project

---

## Workflow

### Step 1: Navigate to Page

Use Playwright MCP to navigate to the target URL:

```
mcp__playwright__playwright_navigate(url: "https://example.com/login")
```

### Step 2: Capture Page State

Take a screenshot and get HTML for analysis:

```
mcp__playwright__playwright_screenshot(name: "page_analysis", fullPage: true)
mcp__playwright__playwright_get_visible_html(cleanHtml: true, removeStyles: true)
```

### Step 3: Analyze Elements

Identify interactive elements from HTML:

| Element Type | Look For |
|--------------|----------|
| **Inputs** | `<input>`, `<textarea>`, `<select>` |
| **Buttons** | `<button>`, `input[type="submit"]`, clickable `<span>`, `<a>` |
| **Forms** | `<form>` with action/method |
| **Navigation** | `<a href>`, routing links |
| **Feedback** | Error divs, alerts, toasts, modals |

### Step 4: Generate Code

1. **Check for BasePage** - If project doesn't have BasePage, create it first (see [base-page-template.md](references/base-page-template.md))
2. **Generate Page Object** - Create class extending BasePage with:
   - Selectors object (private readonly)
   - Navigation method
   - Form filling methods
   - Action methods
   - Validation methods

### Step 5: Close Browser

```
mcp__playwright__playwright_close()
```

---

## Code Generation Rules

### Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| **File** | `snake_case.ts` | `login_page.ts` |
| **Class** | `PascalCase` | `LoginPage` |
| **Methods** | `camelCase` | `fillUsername()` |
| **Selectors** | `camelCase` | `usernameInput` |

### Selector Priority

Choose selectors in this order (see [selector-strategies.md](references/selector-strategies.md)):

1. **ID** - `#username` (most stable)
2. **data-testid** - `[data-testid="username"]`
3. **name** - `[name="username"]`
4. **aria-label** - `[aria-label="Username"]`
5. **Dual selector** - `#username, [name="username"]` (fallback)

### Method Categories

Generate methods based on element types (see [pom-patterns.md](references/pom-patterns.md)):

```typescript
// Navigation
async navigate(): Promise<void>

// Form filling (individual)
async fillUsername(value: string): Promise<void>
async fillPassword(value: string): Promise<void>

// Form filling (combined)
async fillCredentials(credentials: {...}): Promise<void>

// Actions
async clickSubmit(): Promise<void>
async clickForgotPassword(): Promise<void>

// Validation
async getErrorMessage(): Promise<string>
async isLoggedIn(): Promise<boolean>
```

### Wait Strategies

Always include proper waits:

```typescript
// After navigation
await this.page.waitForLoadState('domcontentloaded');

// After form submit
await this.page.waitForLoadState('networkidle', { timeout: 30000 });

// For element visibility
await locator.waitFor({ state: 'visible', timeout: 5000 });
```

---

## Output Template

### BasePage (if needed)

See [base-page-template.md](references/base-page-template.md) for full implementation.

### Page Object Template

```typescript
import { Page } from 'playwright';
import { BasePage } from './BasePage';

export class [PageName]Page extends BasePage {
    private readonly selectors = {
        // Form inputs
        inputName: '#selector',
        // Buttons
        buttonName: '#selector',
        // Feedback
        errorMessage: '#selector',
    };

    constructor(
        page: Page,
        private readonly baseUrl: string = 'https://example.com',
    ) {
        super(page);
    }

    // Navigation
    async navigate(): Promise<void> {
        await super.navigate(`${this.baseUrl}/path`);
        await this.page.waitForLoadState('domcontentloaded');
    }

    // Form Methods
    async fillField(value: string): Promise<void> {
        await this.page.fill(this.selectors.inputName, value);
    }

    // Actions
    async clickButton(): Promise<void> {
        await this.page.click(this.selectors.buttonName);
        await this.page.waitForLoadState('networkidle', { timeout: 30000 });
    }

    // Validation
    async getErrorMessage(): Promise<string> {
        const locator = this.page.locator(this.selectors.errorMessage);
        try {
            await locator.waitFor({ state: 'visible', timeout: 5000 });
            return (await locator.textContent())?.trim() || '';
        } catch {
            return '';
        }
    }
}
```

---

## Usage Examples

### Example 1: Generate Login Page POM

```
User: Tạo POM cho trang https://example.com/login

Assistant:
1. Navigate đến trang sử dụng Playwright MCP
2. Chụp screenshot và phân tích HTML
3. Xác định elements: inputs, buttons, forms
4. Generate POM class với selectors và methods phù hợp
```

### Example 2: Setup POM cho project mới

```
User: Setup Page Object Model structure cho project mới

Assistant:
1. Tạo BasePage class (nếu chưa có)
2. Hỏi user về pages cần tạo
3. Generate từng Page Object theo workflow
```

---

## References

- [base-page-template.md](references/base-page-template.md) - BasePage implementation
- [selector-strategies.md](references/selector-strategies.md) - Selector priority guide
- [pom-patterns.md](references/pom-patterns.md) - Common POM method patterns
