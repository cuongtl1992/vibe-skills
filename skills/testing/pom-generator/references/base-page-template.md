# BasePage Template

> Abstract base class for all Page Objects. Copy this to your project if you don't have one.

## Full Implementation

```typescript
import { Page, Locator } from 'playwright';

/**
 * Abstract base class for all Page Objects.
 * Provides common utilities for navigation, element waiting, and screenshots.
 */
export abstract class BasePage {
    protected page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    /**
     * Navigate to a URL
     * @param url - Full URL to navigate to
     */
    async navigate(url: string): Promise<void> {
        await this.page.goto(url);
    }

    /**
     * Wait for an element to be visible
     * @param selector - CSS selector
     * @param timeout - Maximum wait time in milliseconds (default: 30000)
     * @returns The first matching Locator
     */
    async waitForElement(selector: string, timeout = 30000): Promise<Locator> {
        const locator = this.page.locator(selector);
        await locator.first().waitFor({ state: 'visible', timeout });
        return locator.first();
    }

    /**
     * Take a full-page screenshot
     * @param name - Screenshot filename (without extension)
     */
    async takeScreenshot(name: string): Promise<void> {
        await this.page.screenshot({
            path: `screenshots/${name}.png`,
            fullPage: true
        });
    }

    /**
     * Get current page URL
     */
    async getCurrentUrl(): Promise<string> {
        return this.page.url();
    }

    /**
     * Get page title
     */
    async getTitle(): Promise<string> {
        return this.page.title();
    }

    /**
     * Wait for page to fully load
     */
    async waitForPageLoad(): Promise<void> {
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('networkidle', { timeout: 30000 });
    }

    /**
     * Check if element is visible
     * @param selector - CSS selector
     * @param timeout - Maximum wait time (default: 5000)
     */
    async isElementVisible(selector: string, timeout = 5000): Promise<boolean> {
        try {
            await this.page.locator(selector).first().waitFor({
                state: 'visible',
                timeout
            });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get text content of element
     * @param selector - CSS selector
     */
    async getElementText(selector: string): Promise<string> {
        const locator = await this.waitForElement(selector);
        return (await locator.textContent())?.trim() || '';
    }
}
```

## File Location

Recommended path: `src/page-objects/base/BasePage.ts`

## Usage

```typescript
import { Page } from 'playwright';
import { BasePage } from './base/BasePage';

export class LoginPage extends BasePage {
    constructor(
        page: Page,
        private readonly baseUrl: string,
    ) {
        super(page);
    }

    async navigate(): Promise<void> {
        await super.navigate(`${this.baseUrl}/login`);
        await this.waitForPageLoad();
    }
}
```
