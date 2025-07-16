import { DashboardPage, SignUpPage } from "../pages/";
import { TestDataGenerator, TestUser } from "../utils/TestDataGenerator";
import { expect, test } from "./BaseTest";

test.describe("User Signup", () => {
  let signUpPage: SignUpPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    signUpPage = new SignUpPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test("should sign up a new user", async ({ page }) => {
    // Generate test user data
    const user: TestUser = await TestDataGenerator.generateUser();

    // Complete signup flow
    await signUpPage.signUpUser(user.username, user.email, user.password);

    // Complete tutorial if present
    if (await signUpPage.isTutorialDisplayed()) {
      await dashboardPage.completeTutorialIfPresent();
    }

    // Verify user is logged in
    const isLoggedIn = await signUpPage.isUserLoggedIn();
    expect(isLoggedIn).toBeTruthy();

    // Save user to CSV for future tests
    TestDataGenerator.saveUserToCsv(user);
  });

  test("should handle existing user signup", async ({ page }) => {
    // Try to get an existing user from CSV
    const existingUser = await TestDataGenerator.getRandomUserFromCsv();

    if (existingUser) {
      // Try to sign up with existing user data
      await signUpPage.navigateToSignUpPage();
      await signUpPage.clickSignUpWithEmail();
      await signUpPage.enterUsername(existingUser.username);
      await signUpPage.enterEmail(existingUser.email);
      await signUpPage.enterPassword(existingUser.password);
      await signUpPage.clickSignUpButton();

      // Should show error for existing user
      await page.waitForSelector('.error, .alert, [role="alert"]', { timeout: 10000 });
    } else {
      console.log("⚠️ No existing users found in CSV, skipping existing user test");
    }
  });

  test("should handle invalid signup data", async ({ page }) => {
    // Try to sign up with invalid data
    await signUpPage.navigateToSignUpPage();
    await signUpPage.clickSignUpWithEmail();
    await signUpPage.clickSignUpButton();

    // Should show validation errors
    await page.waitForSelector('.error, .alert, [role="alert"], input:invalid', { timeout: 10000 });
  });
});
