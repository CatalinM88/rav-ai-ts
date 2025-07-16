import { Locator, Page } from "@playwright/test";
import { BasePage } from "./Base.page";

export class DashboardPage extends BasePage {
  private get backButton(): Locator {
    return this.page.locator('button:has-text("Back")');
  }

  private get nextButton(): Locator {
    return this.page.locator('button:has-text("Next")');
  }

  private get finishButton(): Locator {
    return this.page.locator('button:has-text("Finish")');
  }

  private get tutorialTitle(): Locator {
    return this.page.locator("h2.introText");
  }

  constructor(page: Page) {
    super(page);
  }

  async waitForBackButton(): Promise<void> {
    await this.waitForElement(this.backButton);
  }

  async clickNextButton(): Promise<void> {
    await this.waitForElement(this.nextButton);
    await this.nextButton.click();
  }

  async getTutorialTitle(): Promise<string> {
    await this.waitForElement(this.tutorialTitle);
    return (await this.tutorialTitle.textContent()) || "";
  }

  async clickFinishButton(): Promise<void> {
    await this.waitForElement(this.finishButton);
    await this.finishButton.click();
  }

  async completeTutorialIfPresent(): Promise<void> {
    try {
      await this.waitForElement(this.nextButton);
      await this.clickNextButton();

      await this.waitForElement(this.backButton);
      await this.clickNextButton();

      await this.waitForElement(this.backButton);
      await this.clickNextButton();

      await this.waitForElement(this.backButton);
      await this.clickFinishButton();
    } catch (error) {
      //
    }
  }

  async waitForDashboardToLoad(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForLoadState("load");
  }
}
