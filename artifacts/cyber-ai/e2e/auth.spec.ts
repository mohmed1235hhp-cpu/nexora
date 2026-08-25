import { test, expect } from "@playwright/test";

test("register → login → feed", async ({ page }) => {
  const u = `u_${Date.now()}`;
  await page.goto("/register");
  await page.getByLabel(/username/i).fill(u);
  await page.getByLabel(/email/i).fill(`${u}@ex.com`);
  await page.getByLabel(/password/i).fill("Passw0rd!123");
  await page.getByRole("button", { name: /create account|sign up/i }).click();
  await expect(page).toHaveURL(/\/(feed|home|dashboard)/);
});

test("home renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1, [role=heading]").first()).toBeVisible();
});
