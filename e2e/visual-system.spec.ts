import { expect, test } from "@playwright/test";

const viewports = [
  { width: 1440, height: 900 },
  { width: 1280, height: 900 },
  { width: 1024, height: 900 },
  { width: 768, height: 900 },
  { width: 390, height: 844 },
];

for (const viewport of viewports) {
  test(`LowkeyThings marketplace fits ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", { name: /temukan momen yang layak dikenang/i }),
    ).toBeVisible();

    const metrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyFont: getComputedStyle(document.body).fontFamily,
      headingFont: getComputedStyle(document.querySelector("h1")!).fontFamily,
    }));

    expect(metrics.scrollWidth).toBe(metrics.clientWidth);
    expect(metrics.bodyFont).toContain("Inter");
    expect(metrics.headingFont).toContain("Fraunces");
  });
}

test("auth and RPC mobile shells do not overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["/login", "/admin/login", "/rpc/volunteer"]) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  }
});
