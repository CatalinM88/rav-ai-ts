import { Locator, Page } from "@playwright/test";
import { BasePage } from "./Base.page";

export class SignUpPage extends BasePage {
  private get signUpWithEmailButton(): Locator {
    return this.page.locator(".email__button");
  }

  private get usernameField(): Locator {
    return this.page.locator('input[placeholder="Username"]');
  }

  private get emailField(): Locator {
    return this.page.locator('input[placeholder="Email"]');
  }

  private get passwordField(): Locator {
    return this.page.locator('input[placeholder="Password"]');
  }

  private get signUpButton(): Locator {
    return this.page.locator('button[type="submit"]:has-text("Sign Up")');
  }

  private get dashboardElement(): Locator {
    return this.page.locator('span:has-text("Dashboard"), div:has-text("Upload videos to start!")');
  }

  private get tutorialNextButton(): Locator {
    return this.page.locator(".skip__btn");
  }

  constructor(page: Page) {
    super(page);
  }

  async navigateToSignUpPage(): Promise<void> {
    await this.page.goto("https://app.rav.ai/sign_up", { waitUntil: "domcontentloaded" });
  }

  async clickSignUpWithEmail(): Promise<void> {
    await this.waitForElement(this.signUpWithEmailButton);
    await this.signUpWithEmailButton.click();
  }

  async enterUsername(username: string): Promise<void> {
    await this.waitForElement(this.usernameField);
    await this.usernameField.fill(username);
  }

  async enterEmail(email: string): Promise<void> {
    await this.waitForElement(this.emailField);
    await this.emailField.fill(email);
  }

  async enterPassword(password: string): Promise<void> {
    await this.waitForElement(this.passwordField);
    await this.passwordField.fill(password);
  }

  async clickSignUpButton(): Promise<void> {
    await this.waitForElement(this.signUpButton);
    await this.signUpButton.click();
  }

  async isTutorialDisplayed(): Promise<boolean> {
    return await this.isElementPresent(this.tutorialNextButton);
  }

  async isUserLoggedIn(): Promise<boolean> {
    return await this.isElementPresent(this.dashboardElement);
  }

  async signUpUser(username: string, email: string, password: string): Promise<void> {
    await this.navigateToSignUpPage();
    await this.clickSignUpWithEmail();
    await this.enterUsername(username);
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.clickSignUpButton();
  }
}
