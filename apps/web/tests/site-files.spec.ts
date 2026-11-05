import { expect, test } from "@playwright/test";

test("favicon.ico is served for clients that ask for it directly", async ({
  request,
}) => {
  const response = await request.get("/favicon.ico");

  expect(response.status()).toBe(200);
  // ICO header: reserved 0, type 1 (icon).
  const body = await response.body();
  expect([...body.subarray(0, 4)]).toEqual([0, 0, 1, 0]);
});
