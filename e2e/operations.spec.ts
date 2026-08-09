import { expect, test } from "@playwright/test";
import { loginAdmin, loginOrganizer, seededEvent } from "./helpers";

test.describe.serial("operations", () => {
  test("admin can access platform monitoring and seeded refunds", async ({ page }) => {
    await loginAdmin(page);
    await page.goto("/admin/wallet");
    await expect(page.getByRole("heading", { name: "Platform Wallet" })).toBeVisible();
    await expect(page.getByText("Total Collected")).toBeVisible();

    await page.goto("/admin/refunds");
    await page.locator(".field", { hasText: "Pilih Event" }).locator("select").selectOption({ label: "Palembang River Run 2025" });
    await page.getByRole("button", { name: /tampilkan refund/i }).click();
    await expect(page.getByRole("columnheader", { name: "Nominal" })).toBeVisible();
  });

  test("organizer can search and independently mark RPC and race-day check-in", async ({ page, request }) => {
    const event = await seededEvent(request, "Jakarta Marathon 2026");
    await loginOrganizer(page);
    await page.goto("/rpc");
    await expect(page.getByRole("heading", { name: "RPC / Check-in" })).toBeVisible();
    await page.locator("select").selectOption(event.event.id);
    await page.getByPlaceholder(/cari nama.*registrasi/i).fill("Budi");
    await page.getByRole("button", { name: "Cari" }).click();
    await expect(page.getByText("Budi Santoso")).toBeVisible();
    await page.getByRole("button", { name: /tandai racepack/i }).first().click();
    await expect(page.getByText("✓ Racepack", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Hari-H" }).click();
    await page.getByPlaceholder(/cari nama.*registrasi/i).fill("Budi");
    await page.getByRole("button", { name: "Cari" }).click();
    await page.getByRole("button", { name: /tandai hari-h/i }).first().click();
    await expect(page.getByText("✓ Hari-H", { exact: true })).toBeVisible();
  });

  test("volunteer code is event-scoped and cannot unlock organizer navigation", async ({ page, request }) => {
    const event = await seededEvent(request, "Jakarta Marathon 2026");
    await loginOrganizer(page);
    await page.goto(`/dashboard/events/${event.event.id}`);
    await page.getByRole("button", { name: "Peserta & BIB" }).click();
    await page.getByRole("button", { name: /buat kode akses|putar kode/i }).click();
    const codeText = await page.getByText(/^Kode:/).textContent();
    const accessCode = codeText?.replace("Kode:", "").trim();
    expect(accessCode).toBeTruthy();

    await page.goto("/rpc/volunteer");
    await page.getByLabel("Kode akses RPC").fill(accessCode!);
    await page.getByRole("button", { name: /masuk ke event/i }).click();
    await expect(page.getByText(event.event.name)).toBeVisible();
    await expect(page.getByText("Dashboard")).toHaveCount(0);
    await expect(page.getByText("Platform Wallet")).toHaveCount(0);
  });
});
