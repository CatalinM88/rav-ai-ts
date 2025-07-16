import { Locator, Page } from "@playwright/test";
import * as path from "path";
import { BasePage } from "./Base.page";
import { ToasterPage } from "./Toaster.page";

export class ProjectsPage extends BasePage {
  private toasterPage: ToasterPage;

  private get uploadMediaButton(): Locator {
    return this.page.locator('label[for="upload__media--button"]');
  }

  private get uppyIframe(): Locator {
    return this.page.locator('iframe[src*="uppy.html"]');
  }

  private get uploadModalTitle(): Locator {
    return this.page.locator("div.uppy-Dashboard-AddFiles-title");
  }

  private get myDeviceOption(): Locator {
    return this.page.locator('div[data-uppy-acquirer-id="MyDevice"] button');
  }

  private get myDeviceFileInput(): Locator {
    return this.page.locator('input[type="file"]');
  }

  private get uploadDone(): Locator {
    return this.page.locator(".uppy-StatusBar-actionBtn--done");
  }

  private get uppyCloseButton(): Locator {
    return this.page.locator(".connectSocial__cross");
  }

  private get inspirationModalSubmitButton(): Locator {
    return this.page.locator(".inspiration__modal--submit");
  }

  private get generateVideoButton(): Locator {
    return this.page.locator(".generate-video");
  }

  private get confirmGenerateVideoButton(): Locator {
    return this.page.locator('button.pay__modal--submit:has-text("Yes")');
  }

  private get addNotesButton(): Locator {
    return this.page.locator('button:has-text("Add Notes")');
  }

  private get notesInput(): Locator {
    return this.page.locator("textarea.notes_input");
  }

  private get saveNoteButton(): Locator {
    return this.page.locator("button.commentSaveButton");
  }

  private get firstTargetPlatform(): Locator {
    return this.page.locator("div.modal__payments--item").first();
  }

  private get videoGenerationSubmittedConfirmationModal(): Locator {
    return this.page.locator(".massage");
  }

  private get projectNameElements(): Locator {
    return this.page.locator(".project__item--name");
  }

  private get projectStatusElements(): Locator {
    return this.page.locator(".project__item--publish");
  }

  private get deleteProjectButtons(): Locator {
    return this.page.locator(".delete__video--btn");
  }

  constructor(page: Page) {
    super(page);
    this.toasterPage = new ToasterPage(page);
  }

  async createNewProjectWithMedia(relativeFilePath: string): Promise<void> {
    const filePath = path.resolve(process.cwd(), relativeFilePath);

    // Check if page is still valid
    if (this.page.isClosed()) {
      throw new Error("Page is closed, cannot create project");
    }

    await this.clickStartNewProject();
    await this.waitForElement(this.uploadMediaButton);
    await this.toasterPage.dismissIfPresent();

    await this.uploadMediaButton.click();

    // Wait for iframe with better error handling
    try {
      await this.waitForElement(this.uppyIframe);
    } catch (error) {
      throw new Error("Upload modal did not open");
    }

    await this.toasterPage.dismissIfPresent();

    const frame = await this.uppyIframe.elementHandle();
    if (frame) {
      const frameContent = await frame.contentFrame();
      if (frameContent && !frameContent.isDetached()) {
        try {
          await frameContent.waitForSelector("div.uppy-Dashboard-AddFiles-title", { timeout: 10000 });
          await frameContent.click('div[data-uppy-acquirer-id="MyDevice"] button');

          const fileInput = frameContent.locator('input[type="file"]:not([webkitdirectory])').first();
          await fileInput.setInputFiles(filePath);

          await frameContent.click(".uppy-StatusBar-actionBtn--done");
          await frameContent.waitForSelector(".uppy-StatusBar-actionBtn--done", { state: "hidden", timeout: 10000 });
        } catch (error) {
          throw error;
        }
      } else {
        throw new Error("Upload iframe is not available");
      }
    } else {
      throw new Error("Upload iframe not found");
    }

    await this.toasterPage.dismissIfPresent();

    await this.uppyCloseButton.click();
    await this.uppyCloseButton.waitFor({ state: "hidden" });
    await this.toasterPage.dismissIfPresent();

    // Wait for target platform to be available
    try {
      await this.waitForElement(this.firstTargetPlatform);
      await this.firstTargetPlatform.click();
    } catch (error) {
      throw error;
    }
    // Check page validity before each major step
    if (this.page.isClosed()) {
      throw new Error("Page was closed during project creation");
    }

    await this.waitForElement(this.inspirationModalSubmitButton);
    await this.page.waitForTimeout(500);
    await this.inspirationModalSubmitButton.click();
    await this.inspirationModalSubmitButton.waitFor({ state: "hidden" });
    await this.toasterPage.dismissIfPresent();
    await this.page.waitForTimeout(500);

    if (await this.isElementPresent(this.addNotesButton)) {
      if (this.page.isClosed()) {
        throw new Error("Page was closed during notes addition");
      }
      await this.addNotesButton.click();
      await this.waitForElement(this.notesInput);
      await this.notesInput.fill("This is an automated test note.");
      await this.saveNoteButton.click();
      await this.notesInput.waitFor({ state: "hidden" });
      await this.toasterPage.dismissIfPresent();
      await this.page.waitForTimeout(500);
    }

    if (this.page.isClosed()) {
      throw new Error("Page was closed before video generation");
    }

    await this.waitForElement(this.generateVideoButton);
    await this.generateVideoButton.click();

    await this.waitForElement(this.confirmGenerateVideoButton);
    await this.confirmGenerateVideoButton.click();
    await this.confirmGenerateVideoButton.waitFor({ state: "hidden" });
    await this.toasterPage.dismissIfPresent();
  }

  async waitForVideoGenerationConfirmationAndGetText(): Promise<string> {
    await this.waitForElement(this.videoGenerationSubmittedConfirmationModal);
    return (await this.videoGenerationSubmittedConfirmationModal.textContent()) || "";
  }

  async getProjectNameElements(): Promise<Locator[]> {
    await this.waitForElement(this.projectNameElements);
    return await this.projectNameElements.all();
  }

  async getProjectStatusElements(): Promise<Locator[]> {
    return await this.projectStatusElements.all();
  }

  async getProjectCount(): Promise<number> {
    try {
      // Check if any project elements exist first
      const count = await this.projectNameElements.count();
      if (count === 0) {
        // No projects found, return 0 without waiting
        return 0;
      }

      // If projects exist, wait for them to be visible
      await this.waitForElement(this.projectNameElements);
      return await this.projectNameElements.count();
    } catch (error) {
      return 0;
    }
  }

  async deleteAllDraftProjects(): Promise<void> {
    const projectItems = this.page.locator(".project__item");
    const count = await projectItems.count();

    for (let i = 0; i < count; i++) {
      const item = projectItems.nth(i);
      const statusElem = item.locator(".project__item--publish");
      const statusText = await statusElem.textContent();

      if (statusText?.trim() === "Draft") {
        const deleteBtn = item.locator(".delete__video--btn");
        await deleteBtn.click();
        await this.toasterPage.dismissIfPresent();
      }
    }
  }
}
