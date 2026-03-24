import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
  /** 避免浏览器首选中文导致文案断言失败 */
  test.use({ locale: "en-US" });

  test("home loads with main content and link to products", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#main-content")).toBeVisible();
    await expect(page.locator('a[href="/products"]').first()).toBeVisible();
    await expect(page.getByRole("banner")).toBeVisible();
  });

  test("products page loads", async ({ page }) => {
    await page.goto("/products");
    await expect(page.locator("#main-content")).toBeVisible();
    await expect(page).toHaveURL(/\/products/);
  });

  test("products search with match shows product links", async ({ page }) => {
    await page.goto("/products?q=Venom");
    await expect(page).toHaveURL(/[?&]q=Venom/);
    await expect(page.locator("#main-content")).toBeVisible();
    // Slug from seed / default catalog (CI runs db seed)
    const productLink = page.locator('a[href^="/products/"]').filter({ hasText: /Venom/i }).first();
    await expect(productLink).toBeVisible({ timeout: 15_000 });
  });

  test("products search with no match shows empty state", async ({ page }) => {
    await page.goto("/products?q=__e2e_no_such_product_zz__");
    await expect(page.locator("#main-content")).toBeVisible();
    await expect(page.getByText(/No products match this filter/i)).toBeVisible();
  });

  test("home page includes WebSite JSON-LD", async ({ page }) => {
    await page.goto("/");
    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(jsonLd).toBeTruthy();
    expect(jsonLd).toContain("WebSite");
    expect(jsonLd).toContain("SearchAction");
  });

  test("unknown path shows 404 with recovery links", async ({ page }) => {
    await page.goto("/__e2e_missing_route__/nothing-here", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('a[href="/"]').first()).toBeVisible();
    await expect(page.locator('a[href="/products"]').first()).toBeVisible();
  });

  test("cart page renders", async ({ page }) => {
    await page.goto("/cart");
    await expect(page.locator("#main-content")).toBeVisible();
  });

  test("admin products API returns 401 without session", async ({ request }) => {
    const res = await request.get("/api/admin/products");
    expect(res.status()).toBe(401);
  });

  test("login page links to forgot password", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("#main-content")).toBeVisible();
    await expect(page.getByRole("link", { name: /Forgot password/i })).toBeVisible();
    await expect(page.locator('a[href^="/forgot-password"]')).toBeVisible();
  });

  test("forgot-password page submits and shows generic success", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: /Forgot password/i })).toBeVisible();
    await page.getByLabel(/Email/i).fill("e2e-reset@example.com");
    await page.getByRole("button", { name: /Send reset link/i }).click();
    await expect(page.getByText(/If an account exists for that email/i)).toBeVisible({
      timeout: 15_000,
    });
  });

  test("reset-password without token shows invalid link message", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByRole("heading", { name: /Set new password/i })).toBeVisible();
    await expect(
      page.getByText(/invalid or expired\. Request a new reset link/i),
    ).toBeVisible();
  });
});
