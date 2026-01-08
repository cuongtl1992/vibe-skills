# POM Method Patterns

> Common method patterns for Page Object classes.

## Method Categories

### 1. Navigation

```typescript
async navigate(): Promise<void> {
    await super.navigate(`${this.baseUrl}/path`);
    await this.page.waitForLoadState('domcontentloaded');
}
```

### 2. Form Filling (Individual)

```typescript
async fillUsername(value: string): Promise<void> {
    await this.page.fill(this.selectors.usernameInput, value);
}

async fillPassword(value: string): Promise<void> {
    await this.page.fill(this.selectors.passwordInput, value);
}
```

### 3. Form Filling (Combined)

```typescript
async fillCredentials(credentials: {
    username: string;
    password: string;
}): Promise<void> {
    await this.fillUsername(credentials.username);
    await this.fillPassword(credentials.password);
}
```

### 4. Actions

```typescript
async clickSubmit(): Promise<void> {
    await this.page.click(this.selectors.submitBtn);
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
}

async clickLink(): Promise<void> {
    await this.page.click(this.selectors.link);
}
```

### 5. Validation - Get Text

```typescript
async getErrorMessage(): Promise<string> {
    const locator = this.page.locator(this.selectors.errorMessage);
    try {
        await locator.waitFor({ state: 'visible', timeout: 5000 });
        return (await locator.textContent())?.trim() || '';
    } catch {
        return '';
    }
}
```

### 6. Validation - Boolean Check

```typescript
async isLoggedIn(): Promise<boolean> {
    const locator = this.page.locator(this.selectors.dashboard);
    try {
        await locator.waitFor({ state: 'visible', timeout: 5000 });
        return true;
    } catch {
        return false;
    }
}

async isErrorDisplayed(): Promise<boolean> {
    const errorText = await this.getErrorMessage();
    return errorText.length > 0;
}
```

### 7. Selection (Dropdown/Checkbox)

```typescript
async selectOption(value: string): Promise<void> {
    await this.page.selectOption(this.selectors.dropdown, value);
}

async toggleCheckbox(): Promise<void> {
    await this.page.click(this.selectors.checkbox);
}
```

### 8. Complete Flow

```typescript
async login(credentials: {
    username: string;
    password: string;
}): Promise<void> {
    await this.fillCredentials(credentials);
    await this.clickSubmit();
}
```

---

## Wait Strategies

```typescript
// After navigation
await this.page.waitForLoadState('domcontentloaded');

// After form submit (wait for API)
await this.page.waitForLoadState('networkidle', { timeout: 30000 });

// For element visibility
await locator.waitFor({ state: 'visible', timeout: 5000 });

// Combined
await this.page.waitForLoadState('domcontentloaded', { timeout: 30000 });
await this.page.waitForLoadState('networkidle', { timeout: 30000 });
```
