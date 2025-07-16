# Playwright Showcase Test Suite

## Overview

This project demonstrates a flexible Playwright test suite built with **TypeScript** and **Page Object Model (POM)** pattern that can run in two modes:

- **Local Playwright context** (default, fast, no API server required)
- **Remote/API context** (browser context managed by a Playwright API server, for distributed or containerized execution)

## Page Object Model (POM) Implementation

### Structure

All page objects follow a strict TypeScript POM structure:

```typescript
export class ExamplePage extends BasePage {
  // 1. Private Locators (Getters)
  private get usernameInput() {
    return this.page.locator('[data-testid="username"]');
  }
  private get passwordInput() {
    return this.page.locator('[data-testid="password"]');
  }
  private get loginButton() {
    return this.page.locator('[data-testid="login-btn"]');
  }

  // 2. Constructor
  constructor(page: Page) {
    super(page);
  }

  // 3. Public Methods
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
```

### Key POM Features

- **Private Locators**: All element locators are private getters for encapsulation
- **TypeScript Types**: Full type safety with proper interfaces and types
- **Inheritance**: All pages extend `BasePage` for common functionality
- **Method Chaining**: Methods return `this` for fluent API design
- **Async/Await**: Proper async handling throughout

### BasePage Class

```typescript
export class BasePage {
  constructor(protected page: Page) {}

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }

  async navigateTo(url: string): Promise<void> {
    await this.page.goto(url);
    await this.waitForPageLoad();
  }
}
```

## TypeScript Implementation

### Type Safety

```typescript
// Strong typing for test data
interface UserData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

// Typed page methods
async createProject(projectData: ProjectData): Promise<void> {
    // Type-safe implementation
}
```

### Test Structure

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/Login.page";

test.describe("Login Tests", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigateTo("/login");
  });

  test("should login with valid credentials", async () => {
    await loginPage.login("user@example.com", "password123");
    await expect(loginPage.page).toHaveURL(/.*dashboard/);
  });
});
```

## Setup

1. **Install dependencies:**

   ```sh
   npm install
   ```

2. **Configure execution mode:**

   - Edit the `.env` file in the `playwright-api` directory:
     ```
     REMOTE_EXECUTION=false
     API_BASE_URL=http://localhost:3000
     DOCKER_API_URL=http://playwright-api:3000
     ```
   - Set `REMOTE_EXECUTION=true` to use the API server (make sure the API server is running).
   - Set `REMOTE_EXECUTION=false` to use local Playwright context (no API server needed).

3. **Run the tests:**

   ```sh
   npm test
   ```

   - You can also run specific tests:
     ```sh
     npm test -- --grep "should login with valid credentials"
     ```

## Project Structure

```
src/
├── pages/           # Page Object Model classes
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   ├── SignUpPage.ts
│   ├── DashboardPage.ts
│   ├── ProjectsPage.ts
│   └── ToasterPage.ts
├── tests/           # Test files
│   ├── BaseTest.ts
│   ├── LoginTests.spec.ts
│   ├── SignUpTests.spec.ts
│   ├── ProjectCreationTests.spec.ts
│   └── DashboardTests.spec.ts
└── utils/           # Utilities
    └── TestDataGenerator.ts
```

## POM Best Practices

### 1. Encapsulation

- All locators are private getters
- Public methods provide the interface for tests
- Internal implementation details are hidden

### 2. Reusability

- Common functionality in `BasePage`
- Page-specific logic in individual page classes
- Shared utilities in separate modules

### 3. Maintainability

- Single responsibility principle
- Clear separation of concerns
- Easy to update locators when UI changes

### 4. Type Safety

- Full TypeScript support
- Compile-time error checking
- IntelliSense support in IDEs

## How it works

- The test runner checks the `REMOTE_EXECUTION` flag in `.env`.
- If `true`, it uses the API server to create and manage browser contexts.
- If `false`, it uses the standard Playwright local browser context.
- No code changes are needed to switch modes—just update `.env`.
- When a context is created, a log message is printed to the console indicating whether it is local or remote (with context id).

## Clean Code

- All `console.log` statements have been removed for a professional, showcase-ready codebase, except for context creation logs and error logs in utility code.
- Error logs are only present in utility code for debugging.

---

**Ready to showcase!**
