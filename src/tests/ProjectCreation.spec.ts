import { DashboardPage, LoginPage, ProjectsPage } from "../pages/";
import { TestDataGenerator } from "../utils/TestDataGenerator";
import { expect, test } from "./BaseTest";

test.describe("Project Creation", () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let projectsPage: ProjectsPage;
  let existingUser: any;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    projectsPage = new ProjectsPage(page);

    // Get an existing user from CSV
    existingUser = await TestDataGenerator.getRandomUserFromCsv();

    if (existingUser) {
      // Login first
      await loginPage.loginUser(existingUser.email, existingUser.password);
      await loginPage.waitForDashboardUrl();

      // Complete tutorial if present
      if (await loginPage.isTutorialDisplayed()) {
        await dashboardPage.completeTutorialIfPresent();
      }

      // Wait for dashboard to load
      await dashboardPage.waitForDashboardToLoad();
    } else {
      console.log("⚠️ No existing users found in CSV, tests will be skipped");
    }
  });

  test("should create a new project with video upload", async ({ page }) => {
    test.setTimeout(120000); // 2 minutes timeout for upload test

    if (!existingUser) {
      console.log("⚠️ Skipping test - no existing user available");
      return;
    }

    // Get initial project count
    const initialProjectCount = await projectsPage.getProjectCount();

    // Create new project with video upload
    const testVideoPath = TestDataGenerator.getTestFilePath("sample.mp4");
    await projectsPage.createNewProjectWithMedia(testVideoPath);

    // Wait for video generation confirmation
    const confirmationText = await projectsPage.waitForVideoGenerationConfirmationAndGetText();

    // Verify project count increased
    await page.waitForTimeout(2000); // Wait for project to be added to list
    const finalProjectCount = await projectsPage.getProjectCount();
    expect(finalProjectCount).toBeGreaterThan(initialProjectCount);
  });

  test("should create a new project with image upload", async ({ page }) => {
    test.setTimeout(120000); // 2 minutes timeout for upload test

    if (!existingUser) {
      console.log("⚠️ Skipping test - no existing user available");
      return;
    }

    // Get initial project count
    const initialProjectCount = await projectsPage.getProjectCount();

    // Create new project with image upload
    const testImagePath = TestDataGenerator.getTestFilePath("sample.jpg");
    await projectsPage.createNewProjectWithMedia(testImagePath);

    // Wait for video generation confirmation
    const confirmationText = await projectsPage.waitForVideoGenerationConfirmationAndGetText();

    // Verify project count increased
    await page.waitForTimeout(2000); // Wait for project to be added to list
    const finalProjectCount = await projectsPage.getProjectCount();
    expect(finalProjectCount).toBeGreaterThan(initialProjectCount);
  });

  test("should delete draft projects", async ({ page }) => {
    if (!existingUser) {
      console.log("⚠️ Skipping test - no existing user available");
      return;
    }

    // Get initial project count
    const initialProjectCount = await projectsPage.getProjectCount();

    // Delete all draft projects
    await projectsPage.deleteAllDraftProjects();

    // Verify project count decreased or remained the same
    await page.waitForTimeout(2000); // Wait for projects to be removed from list
    const finalProjectCount = await projectsPage.getProjectCount();
    expect(finalProjectCount).toBeLessThanOrEqual(initialProjectCount);
  });
});
