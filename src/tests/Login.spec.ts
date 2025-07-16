import { DashboardPage, LoginPage } from "../pages/";
import { TestDataGenerator } from "../utils/TestDataGenerator";
import { expect, test } from "./BaseTest";

test.describe("User Login", () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test("should login with valid credentials", async ({ page }) => {
    // Try to get an existing user from CSV
    const existingUser = await TestDataGenerator.getRandomUserFromCsv();

    if (existingUser) {
      // Complete login flow
      await loginPage.loginUser(existingUser.email, existingUser.password);

      // Wait for dashboard to load
      await loginPage.waitForDashboardUrl();

      // Complete tutorial if present
      if (await loginPage.isTutorialDisplayed()) {
        await dashboardPage.completeTutorialIfPresent();
      }

      // Verify login was successful
      const isLoginSuccessful = await loginPage.isLoginSuccessful();
      expect(isLoginSuccessful).toBeTruthy();
    } else {
      console.log("⚠️ No existing users found in CSV, skipping login test");
    }
  });

  test("should handle invalid credentials", async ({ page }) => {
    await loginPage.navigateToLoginPage();
    await loginPage.clickSignInWithEmail();
    await loginPage.login("invalid@email.com", "wrongpassword");

    // Should show error for invalid credentials
    await page.waitForSelector('.error, .alert, [role="alert"]', { timeout: 10000 });
  });

  test("should handle empty credentials", async ({ page }) => {
    await loginPage.navigateToLoginPage();
    await loginPage.clickSignInWithEmail();
    await loginPage.clickLoginButton();

    // Should show validation errors
    await page.waitForSelector('.error, .alert, [role="alert"], input:invalid', { timeout: 10000 });
  });
});
