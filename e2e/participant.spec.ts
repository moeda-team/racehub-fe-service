import { expect, test } from "@playwright/test";
import { firstRegistrableEvent, webhookSignature } from "./helpers";

test("participant can register, pay through the stub webhook, and open an e-ticket", async ({ page, request }) => {
  const event = await firstRegistrableEvent(request);
  const category = event.categories.find((item) => item.quota_remaining > 0)!;
  const ticket = event.ticket_categories.find((item) => item.category_id === category.id && item.quota_remaining > 0)!;
  const email = `e2e-participant-${Date.now()}@example.test`;

  await page.goto(`/register/${event.event.id}`);
  await page.locator("select").first().selectOption(category.id);
  await page.locator(".field", { hasText: "Tiket" }).locator("select").selectOption(ticket.id);
  await page.getByRole("button", { name: "Lanjut" }).click();
  await page.locator(".field", { hasText: "Nama Lengkap" }).locator("input").fill("Peserta E2E");
  await page.locator(".field", { hasText: "Email" }).locator("input").fill(email);
  await page.locator(".field", { hasText: "No. HP" }).locator("input").fill("081234567890");
  await page.locator(".field", { hasText: "Tanggal Lahir" }).locator("input").fill("1990-01-01");
  await page.locator(".field", { hasText: "Jenis Kelamin" }).locator("select").selectOption("male");
  await page.getByRole("button", { name: "Lanjut" }).click();
  await page.getByRole("button", { name: "Daftar Sekarang" }).click();
  await expect(page.getByText("Pendaftaran berhasil")).toBeVisible();

  const registrationNumber = (await page.locator("text=/REG-/").first().textContent())!.trim();
  await page.getByRole("button", { name: /lanjut ke pembayaran/i }).click();
  await page.getByRole("button", { name: "VA BCA" }).click();
  await expect(page.getByText("Harga Tiket")).toBeVisible();
  const chargeResponse = page.waitForResponse((response) => response.url().endsWith("/api/v1/payments/charge") && response.status() === 201);
  await page.getByRole("button", { name: "Bayar Sekarang" }).click();
  const charged = await (await chargeResponse).json() as { data: { transaction_id: string; quote: { sub_total: number } } };

  const notification = await request.post("/api/v1/payments/notification", {
    data: {
      order_id: charged.data.transaction_id,
      transaction_id: charged.data.transaction_id,
      transaction_status: "settlement",
      status_code: "200",
      gross_amount: `${charged.data.quote.sub_total}.00`,
      signature_key: webhookSignature(charged.data.transaction_id, "200", charged.data.quote.sub_total),
    },
  });
  expect(notification.ok()).toBeTruthy();

  await page.goto(`/pay/${registrationNumber}`);
  await expect(page.getByText("Pembayaran lunas")).toBeVisible();
  await page.getByRole("button", { name: /lihat e-tiket/i }).click();
  await expect(page.getByText(registrationNumber)).toBeVisible();
  await expect(page.locator("svg").first()).toBeVisible();
});
