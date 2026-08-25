import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("home has no critical a11y issues", async ({ page }) => {
  await page.goto("/");
  const res = await new AxeBuilder({ page }).analyze();
  const critical = res.violations.filter(v => v.impact === "critical");
  expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
});
