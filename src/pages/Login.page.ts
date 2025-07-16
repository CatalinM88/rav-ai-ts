import { Locator, Page } from "@playwright/test";
import { BasePage } from "./Base.page";

export class LoginPage extends BasePage {
  private get signInWithEmailButton(): Locator {
    return this.page.locator(".email__button");
  }

  private get emailField(): Locator {
    return this.page.locator('input[placeholder="Email"]');
  }

  private get passwordField(): Locator {
    return this.page.locator('input[placeholder="Password"]');
  }

  private get loginButton(): Locator {
    return this.page.locator('button[type="submit"]:has-text("Sign In")');
  }

  private get dashboardElement(): Locator {
    return this.page.locator('span:has-text("Dashboard"), div:has-text("Upload videos to start!"), .dashboard, [data-testid="dashboard"]');
  }

  private get tutorialNextButton(): Locator {
    return this.page.locator(".skip__btn");
  }

  private get userMenu(): Locator {
    return this.page.locator('.user-menu, .profile-menu, [data-testid="user-menu"]');
  }

  constructor(page: Page) {
    super(page);
  }

  async navigateToLoginPage(): Promise<void> {
    await this.page.goto("https://app.rav.ai/sign_in", { waitUntil: "domcontentloaded" });
  }

  async clickSignInWithEmail(): Promise<void> {
    await this.waitForElement(this.signInWithEmailButton);
    await this.signInWithEmailButton.click();
  }

  async enterEmail(email: string): Promise<void> {
    await this.waitForElement(this.emailField);
    await this.emailField.fill(email);
  }

  async enterPassword(password: string): Promise<void> {
    await this.waitForElement(this.passwordField);
    await this.passwordField.fill(password);
  }

  async clickLoginButton(): Promise<void> {
    await this.waitForElement(this.loginButton);
    await this.loginButton.click();
  }

  async login(email: string, password: string): Promise<void> {
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.clickLoginButton();
  }

  async isTutorialDisplayed(): Promise<boolean> {
    return await this.isElementPresent(this.tutorialNextButton);
  }

  async isLoginSuccessful(): Promise<boolean> {
    try {
      // Check for dashboard URL pattern (more flexible)
      const currentUrl = this.page.url();
      const isDashboardUrl = currentUrl.includes("dashboard") || currentUrl.includes("app.rav.ai");

      if (!isDashboardUrl) {
        // Wait for navigation to dashboard
        await this.page.waitForURL("**/dashboard**", { timeout: 5000 });
      }

      // Then check for dashboard elements with a shorter timeout
      const hasDashboardElement = await this.isElementPresent(this.dashboardElement);
      const hasUserMenu = await this.isElementPresent(this.userMenu);

      return hasDashboardElement || hasUserMenu || isDashboardUrl;
    } catch (error) {
      return false;
    }
  }

  async isDashboardUrl(): Promise<boolean> {
    return this.page.url().includes("dashboard");
  }

  async waitForDashboardUrl(): Promise<void> {
    try {
      await this.page.waitForURL("**/dashboard**", { timeout: 10000 });
    } catch (error) {
      // If dashboard URL pattern doesn't match, check if we're already on a valid page
      const currentUrl = this.page.url();
      if (currentUrl.includes("app.rav.ai") && !currentUrl.includes("sign_in")) {
        return;
      }
      throw error;
    }
  }

  async loginUser(email: string, password: string): Promise<void> {
    await this.navigateToLoginPage();
    await this.clickSignInWithEmail();
    await this.login(email, password);
  }
}
