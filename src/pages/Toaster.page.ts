import { Locator, Page } from "@playwright/test";
import { BasePage } from "./Base.page";

export class ToasterPage extends BasePage {
  private get toasterElement(): Locator {
    return this.page.locator('.toaster, .toast, [role="alert"], .notification');
  }

  private get closeButton(): Locator {
    return this.page.locator('.toaster .close, .toast .close, [role="alert"] .close, .notification .close');
  }

  private get dismissButton(): Locator {
    return this.page.locator('.toaster .dismiss, .toast .dismiss, [role="alert"] .dismiss, .notification .dismiss');
  }

  constructor(page: Page) {
    super(page);
  }

  async dismissIfPresent(): Promise<void> {
    try {
      if (await this.isElementPresent(this.toasterElement)) {
        if (await this.isElementPresent(this.closeButton)) {
          await this.closeButton.click();
        } else if (await this.isElementPresent(this.dismissButton)) {
          await this.dismissButton.click();
        } else {
          await this.toasterElement.click();
        }
        await this.toasterElement.waitFor({ state: "hidden", timeout: 5000 });
      }
    } catch (error) {}
  }

  async waitForToaster(): Promise<void> {
    await this.waitForElement(this.toasterElement);
  }

  async getToasterText(): Promise<string> {
    await this.waitForElement(this.toasterElement);
    return (await this.toasterElement.textContent()) || "";
  }

  async isToasterVisible(): Promise<boolean> {
    return await this.isElementPresent(this.toasterElement);
  }
}
