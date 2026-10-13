import { defineConfig, devices } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

const sharedChromium = {
  ...devices["Desktop Chrome"],
  channel: undefined,
};

export default defineConfig({
  testDir: "./specs",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["json", { outputFile: "test-results/results.json" }],
    ["./reporters/rapport-reporter.ts"],
  ],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npx serve .. -l 4173 --no-port-switching",
    cwd: __dirname,
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: "desktop-chromium",
      testIgnore: [/c-monkey\.spec/, /h-lighthouse\.spec/, /i-live-qr\.spec/],
      use: { ...sharedChromium, viewport: { width: 1280, height: 800 } },
    },
    {
      name: "iphone-se-chromium",
      testIgnore: [/c-monkey\.spec/, /h-lighthouse\.spec/, /i-live-qr\.spec/],
      use: { ...devices["iPhone SE"], ...sharedChromium },
    },
    {
      name: "iphone-se-webkit",
      testIgnore: [/c-monkey\.spec/, /h-lighthouse\.spec/, /i-live-qr\.spec/, /j-external/],
      use: { ...devices["iPhone SE"] },
    },
    {
      name: "iphone-14-chromium",
      testIgnore: [/c-monkey\.spec/, /h-lighthouse\.spec/, /i-live-qr\.spec/],
      use: { ...devices["iPhone 14"], ...sharedChromium },
    },
    {
      name: "iphone-14-webkit",
      testIgnore: [/c-monkey\.spec/, /h-lighthouse\.spec/, /i-live-qr\.spec/, /j-external/],
      use: { ...devices["iPhone 14"] },
    },
    {
      name: "pixel-7-chromium",
      testIgnore: [/c-monkey\.spec/, /h-lighthouse\.spec/, /i-live-qr\.spec/],
      use: { ...devices["Pixel 7"], ...sharedChromium },
    },
    {
      name: "ipad-chromium",
      testIgnore: [/c-monkey\.spec/, /h-lighthouse\.spec/, /i-live-qr\.spec/],
      use: { ...sharedChromium, viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true },
    },
    {
      name: "monkey-desktop",
      testMatch: /c-monkey\.spec/,
      use: { ...sharedChromium, viewport: { width: 1280, height: 800 } },
    },
    {
      name: "lighthouse-desktop",
      testMatch: /h-lighthouse\.spec/,
      use: { ...sharedChromium, viewport: { width: 1280, height: 800 } },
    },
    {
      name: "live",
      testMatch: /i-live-qr\.spec/,
      use: {
        baseURL: "https://loopbaangps.moreelvakmanschap.nl",
        ...sharedChromium,
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
