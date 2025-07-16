import { test as base, Browser, BrowserContext, chromium, expect, Page } from "@playwright/test";
import * as dotenv from "dotenv";
import fetch from "node-fetch";

// Load environment variables
dotenv.config();

const REMOTE_EXECUTION = process.env.REMOTE_EXECUTION === "true";
const API_BASE_URL = process.env.DOCKER === "true" ? process.env.DOCKER_API_URL || "http://playwright-api:3000" : process.env.API_BASE_URL || "http://localhost:3000";

interface ApiResponse {
  id: string;
  wsEndpoint: string;
}

async function createBrowserContextWithRetry(maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const post = await fetch(`${API_BASE_URL}/instance`, { method: "POST" });
      const response = (await post.json()) as any;

      if (response.error) {
        if (response.error.includes("No free port") || response.error.includes("address already in use")) {
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
        }
        throw new Error(`API Error: ${response.error}`);
      }

      return response;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error(`Failed to create browser context after ${maxRetries} attempts`);
}

export const test = base.extend<{
  page: Page;
  browser: Browser;
  context: BrowserContext;
}>({
  browser: async ({}, use) => {
    if (REMOTE_EXECUTION) {
      // API-based execution - browser is managed by API server
      await use(null as any);
    } else {
      // Standard Playwright execution
      const browser = await chromium.launch({
        headless: process.env.NODE_ENV === "production" || process.env.DOCKER === "true",
        args: process.env.NODE_ENV === "production" || process.env.DOCKER === "true" ? ["--no-sandbox", "--disable-setuid-sandbox"] : ["--start-maximized"],
      });
      console.log("[Playwright] Local browser context created.");
      await use(browser);
      await browser.close();
    }
  },

  context: async ({ browser }, use) => {
    if (REMOTE_EXECUTION) {
      // API-based execution - context is managed by API server
      await use(null as any);
    } else {
      // Standard Playwright execution
      const context = await browser.newContext();
      console.log("[Playwright] Local browser context instance created.");
      await use(context);
      await context.close();
    }
  },

  page: async ({ context, browser }, use) => {
    if (REMOTE_EXECUTION) {
      // API-based execution
      let browserInstance = null;
      let contextId = null;

      try {
        const response = await createBrowserContextWithRetry();
        const { id, wsEndpoint }: ApiResponse = response as ApiResponse;
        contextId = id;

        browserInstance = await chromium.connect(wsEndpoint);
        const ctx = await browserInstance.newContext();
        const page = await ctx.newPage();
        console.log(`[Playwright] Remote browser context created (id: ${contextId}).`);
        await use(page);
      } catch (error) {
        throw error;
      } finally {
        if (browserInstance) {
          try {
            await browserInstance.close();
          } catch (error) {
            // Ignore cleanup errors
          }
        }

        if (contextId) {
          try {
            await fetch(`${API_BASE_URL}/instance/${contextId}`, { method: "DELETE" });
          } catch (error) {
            // Ignore cleanup errors
          }
        }
      }
    } else {
      // Standard Playwright execution
      const page = await context.newPage();
      await use(page);
    }
  },
});

export { expect };
