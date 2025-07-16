import { Locator, Page } from "@playwright/test";

export class BasePage {
  protected page: Page;

  private get logo(): Locator {
    return this.page.locator("a.logo_block");
  }

  private get startNewProjectButton(): Locator {
    return this.page.locator(".menu__upload--button").first();
  }

  private get userAvatar(): Locator {
    return this.page.locator('.menu__user img[alt="avatar"]');
  }

  private get userName(): Locator {
    return this.page.locator(".menu__user--name");
  }

  private get logoutButton(): Locator {
    return this.page.locator('button:has-text("Logout"), a:has-text("Logout")');
  }

  constructor(page: Page) {
    this.page = page;
  }

  async clickLogo(): Promise<void> {
    await this.logo.click();
  }

  async clickStartNewProject(): Promise<void> {
    await this.startNewProjectButton.click();
  }

  async clickLogout(): Promise<void> {
    await this.logoutButton.click();
  }

  async getUserName(): Promise<string> {
    return (await this.userName.textContent()) || "";
  }

  async waitForElement(locator: Locator, timeout: number = 10000): Promise<void> {
    try {
      await locator.waitFor({ timeout, state: "visible" });
    } catch (error) {
      throw error;
    }
  }

  async isElementPresent(locator: Locator): Promise<boolean> {
    try {
      await locator.waitFor({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async waitForUrl(url: string): Promise<void> {
    await this.page.waitForURL(url, { timeout: 10000 });
  }
}
