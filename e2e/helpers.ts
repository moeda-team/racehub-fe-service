import { createHash } from "node:crypto";
import { expect, type APIRequestContext, type Page } from "@playwright/test";

type Envelope<T> = { data: T };
type PublicEvent = {
  id: string;
  event: { id: string; name: string };
  categories: Array<{ id: string; quota_remaining: number }>;
  ticket_categories: Array<{ id: string; category_id: string; quota_remaining: number }>;
};

export async function firstRegistrableEvent(request: APIRequestContext): Promise<PublicEvent> {
  const list = await request.get("/api/v1/events");
  expect(list.ok()).toBeTruthy();
  const events = (await list.json() as Envelope<Array<{ id: string }>>).data;
  for (const event of events) {
    const detail = await request.get(`/api/v1/events/${event.id}`, { headers: { "X-RaceHub-Public": "1" } });
    if (!detail.ok()) continue;
    const data = (await detail.json() as Envelope<PublicEvent>).data;
    const category = data.categories.find((item) => item.quota_remaining > 0);
    const ticket = category && data.ticket_categories.find((item) => item.category_id === category.id && item.quota_remaining > 0);
    if (ticket) return data;
  }
  throw new Error("No seeded event has a registrable ticket");
}

export async function seededEvent(request: APIRequestContext, name: string): Promise<PublicEvent> {
  const list = await request.get("/api/v1/events");
  expect(list.ok()).toBeTruthy();
  const events = (await list.json() as Envelope<Array<{ id: string; name: string }>>).data;
  const event = events.find((item) => item.name === name);
  if (!event) throw new Error(`Seeded event ${name} was not found`);
  const detail = await request.get(`/api/v1/events/${event.id}`, { headers: { "X-RaceHub-Public": "1" } });
  expect(detail.ok()).toBeTruthy();
  return (await detail.json() as Envelope<PublicEvent>).data;
}

export async function loginOrganizer(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("organizer@racehub.id");
  await page.getByLabel("Password").fill("organizer12345");
  await page.getByRole("button", { name: /masuk/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

export async function loginAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill("admin@racehub.id");
  await page.getByLabel("Password").fill("admin12345");
  await page.getByRole("button", { name: /masuk/i }).click();
  await expect(page).toHaveURL(/\/admin\/overview/);
}

export function webhookSignature(orderID: string, statusCode: string, grossAmount: number) {
  // The stub gateway verifies SHA512(order_id + status_code + gross_amount + server_key).
  // Node crypto is intentionally used only by test infrastructure, never app code.
  return createHash("sha512").update(`${orderID}${statusCode}${grossAmount}.00stub-server-key`).digest("hex");
}
