# Feature Roadmap — US Buyers, Auth, Payment, Order Tracking, Admin

**Primary audience: US buyers.** USD, English-first UI (plus zh/es), US shipping messaging, Stripe-ready checkout.

---

## Current implementation (this repo)

| Area | Status |
|------|--------|
| **Auth** | NextAuth.js (**credentials** + optional **Google OAuth**) + Prisma `User` (`buyer` / `admin`). Google 首次登录自动建 `buyer`；**同邮箱已注册**则关联既有账户（含管理员）。**忘记密码**：`/forgot-password` → `POST /api/auth/forgot-password`（防枚举统一成功）→ Resend 邮件内链 `/reset-password?token=…`（1h 有效）→ `POST /api/auth/reset-password`。**限流**：`forgot-password` / `reset-password` / **`register`** 按 IP 进程内固定窗口（多副本需换 Redis 等）；`/forgot-password`、`/reset-password` 页面 **noindex** + `robots.txt` disallow。注册接口校验邮箱形态与密码长度。 |
| **Admin** | `/admin` + `/api/admin/*` protected by **`requireAdminSession()`** (DB `role === admin`). Products CRUD in **SQLite/Prisma**（`POST /api/admin/products`：**slug 规范化与唯一**、价格/图片 URL/分类品牌/变体数量与字段长度等校验，不通过则 **400** 明细）。Orders list + status/tracking update。 |
| **Catalog** | Products in DB (seed from `src/lib/data.ts` + optional `data/custom-products.json`). List: filters, search (`contains` on fields), sort, **DB pagination** (newest/name + no price sort). |
| **Checkout** | Address form; **`POST /api/orders`** (pending) or **Stripe Checkout** when `STRIPE_SECRET_KEY` set; webhook creates **paid** orders。购物车 **`validateCartLines`**：行数/数量上限、总价上限、**变体价以 Prisma 中 `variations` JSON 为准**（不信任客户端 `selectedVariant.price`）；收货人/电话/地址长度与格式校验（`order-shipping-input`）；每用户 **下单 / Stripe 创建会话** 各约 **40 次/小时** 进程内限流。 |
| **Buyer orders** | **My orders**: status labels (i18n), **tracking # + carrier**, links for **USPS / UPS / FedEx / DHL** + Google fallback (`src/lib/shipping-tracking.ts`). |
| **Email** | Optional Resend: **order confirmation** + **shipped** (when admin sets status to Shipped, once per order). |
| **SEO** | Sitemap/robots, Product + BreadcrumbList + ItemList JSON-LD, home **WebSite / Organization / SearchAction**, `NEXT_PUBLIC_SITE_URL`. |
| **CI** | GitHub Actions: lint, `tsc`, build, **PostgreSQL** 服务 + Prisma migrate + seed, Playwright smoke. |

---

## Pre-launch (remaining / harden)

| Priority | Feature | Notes |
|----------|---------|--------|
| · | **Production DB** | 应用与 CI 已以 **PostgreSQL** 为默认；生产请配置托管 PG + `DATABASE_URL`（见 `docs/POSTGRES-MIGRATION.md`）。 |
| · | **OAuth** | ~~Google~~ optional via env；可再加 Apple / GitHub 等 provider。 |
| · | **Shipped email** | ~~Implemented~~ (`sendOrderShippedEmail` on transition to `shipped`). Optional: i18n email body / queue retries. |
| · | **Tax** | Stripe Tax or state rules for US sales tax. |
| · | **Secrets & ops** | Strong `NEXTAUTH_SECRET`, rotate admin password, Stripe live keys + webhook URL in dashboard. |

---

## Admin: products (historical note)

- **Earlier:** custom products could live in `data/custom-products.json`.
- **Now:** primary store is **Prisma `Product`**; seed + Admin UI read/write DB. JSON migration still runs in `prisma/seed.ts` if the file exists.

---

## US-focused details

- **Currency:** USD in UI and Stripe.
- **Shipping:** Copy emphasizes US domestic; flat-rate messaging on checkout.
- **Carriers:** Tracking URLs centralized in `shipping-tracking.ts` — extend as needed.

---

## Later (post-launch)

| Feature | Description |
|---------|-------------|
| **Inventory** | Per-SKU stock; preorder windows; low-stock flags. |
| **Reviews** | Product ratings + moderation. |
| **Wishlist** | Logged-in saved items. |
| **Multi-currency** | If expanding beyond USD. |

---

## Tech stack (as deployed here)

- **Auth:** NextAuth.js (credentials).
- **DB:** Prisma + **PostgreSQL**（本地/CI/生产均需 `DATABASE_URL`）；迁移与回滚见 `docs/POSTGRES-MIGRATION.md`、`docs/ROLLBACK-PRODUCTION.md`。
- **Payment:** Stripe Checkout + webhook（`checkout.session.completed` → `stripe-fulfill-checkout`：**重跑 `validateCartLines`**、收货 metadata 校验、`usd` + **`amount_total` 与库内重算总价（分）一致** 后才建单）。
- **Email:** Resend (optional).
- **E2E:** Playwright (`e2e/smoke.spec.ts`).
