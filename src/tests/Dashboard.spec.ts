import { DashboardPage, LoginPage } from "../pages/";
import { TestDataGenerator } from "../utils/TestDataGenerator";
import { expect, test } from "./BaseTest";

test.describe("Dashboard Functionality", () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let existingUser: any;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);

    // Get an existing user from CSV
    existingUser = await TestDataGenerator.getRandomUserFromCsv();

    if (existingUser) {
      // Login first
      await loginPage.loginUser(existingUser.email, existingUser.password);
      await loginPage.waitForDashboardUrl();
    } else {
      console.log("⚠️ No existing users found in CSV, tests will be skipped");
    }
  });

  test("should complete tutorial successfully", async ({ page }) => {
    if (!existingUser) {
      console.log("⚠️ Skipping test - no existing user available");
      return;
    }

    // Complete tutorial if present
    if (await loginPage.isTutorialDisplayed()) {
      await dashboardPage.completeTutorialIfPresent();
    }

    // Wait for dashboard to load
    await dashboardPage.waitForDashboardToLoad();
  });

  test("should navigate dashboard elements", async ({ page }) => {
    if (!existingUser) {
      console.log("⚠️ Skipping test - no existing user available");
      return;
    }

    try {
      // Complete tutorial if present
      if (await loginPage.isTutorialDisplayed()) {
        await dashboardPage.completeTutorialIfPresent();
      }

      // Wait for dashboard to load
      await dashboardPage.waitForDashboardToLoad();

      await dashboardPage.clickStartNewProject();
    } catch (error) {
      console.log("❌ Start new project click failed:", (error as Error).message);
      throw error;
    }

    console.log("✅ Dashboard navigation test completed successfully!");
  });

  test("should verify user information display", async ({ page }) => {
    if (!existingUser) {
      console.log("⚠️ Skipping test - no existing user available");
      return;
    }

    // Complete tutorial if present
    if (await loginPage.isTutorialDisplayed()) {
      await dashboardPage.completeTutorialIfPresent();
    }

    // Get and verify user name
    const userName = await dashboardPage.getUserName();
    expect(userName).toBeTruthy();
    console.log("✅ User information display test completed successfully!");
  });
});
