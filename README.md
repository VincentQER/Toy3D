# PrintFig — 3D 打印手办电商网站

类似 [BigBadToyStore](https://www.bigbadtoystore.com/) 的电商站，**主要面向美国买家**：Action Figure 与雕像，Marvel、DC、Sonic 等美漫与游戏角色，3D 打印可动人偶与收藏级手办。

## 功能概览

- **首页**：Hero、分类入口、精选商品；**JSON-LD**（`Organization` + `WebSite` + **`SearchAction`**；可选 **`NEXT_PUBLIC_ORGANIZATION_LOGO`**、**`NEXT_PUBLIC_ORGANIZATION_SAME_AS`**；依赖 `NEXT_PUBLIC_SITE_URL`）
- **商品**：类型 + 品牌 / 角色筛选；**关键词**在 Prisma 层对 `name` / `description` / `slug` / i18n JSON 字段做 **`contains`**（与旧版「整段 blob」略有差异）；**排序**（最新 / 价格 / 名称）；列表 **分页**（每页 24 条；**排序为最新或名称时**数据库 `count` + `skip`/`take`；**按价格排**时在同条件下 `findMany` 后内存排序）；**ItemList** JSON-LD；详情 **Product + BreadcrumbList**；**SEO 元数据**
- **SEO 文件**：`/sitemap.xml`（首页、静态页、全部商品详情 URL）、`/robots.txt`（禁止抓取 `/admin`、`/account`、`/checkout`、`/api` 等）
- **metadataBase**：根布局用 `NEXT_PUBLIC_SITE_URL` 设置 `metadataBase`，统一解析 OG/Twitter 相对路径与 canonical（商品详情用路径 `/products/...` 即可）
- **无障碍**：键盘「跳到主要内容」、全局 `:focus-visible` 焦点环、页眉主导航/语言/购物车 `aria-*`、页脚 `nav` 地标、购物车 ± 与商品规格按钮标签
- **错误页**：全局 **`not-found`**（404，多语言、SEO `noindex`）、**`error.tsx`**（运行时错误，重试 + 回首页；开发环境显示错误信息）
- **购物车与结账**：加购、改数量；购物车 **`localStorage` 持久化**（键 `printfig-cart-v1`，刷新不丢）；**空购物车 / 空结账 / 未登录** 引导页；结账 **美国运费说明**（小计与运费分开）、地址字段多语言标签；可选 **Stripe Checkout**（配置密钥后）；未配置时仍为演示下单（`pending`）；**`POST /api/orders` 与 Stripe 创建会话** 会校验收货信息、购物车行数/数量/总价，**多规格商品价格在服务端按数据库 `variations` 重算**（防改价），并对每用户 **约 40 次/小时** 限流（进程内）；下单错误与网络异常提示
- **买家账户**：概览、我的订单、收货地址、账户资料（登录后可见）
- **管理员后台**：管理员登录后可上传新玩具、编辑/删除自定义商品

### 管理员上传新玩具

1. 使用 **admin@printfig.com**（任意密码）登录。
2. 顶部出现 **Admin** 链接，进入后台。
3. **Admin → Products → Add Product** 填写名称、价格(USD)、图片 URL、分类、品牌、角色等，提交后商品写入 `data/custom-products.json`，前台立即展示。
4. **Admin → Products** 列表中，“Custom” 商品可 **Edit** 或 **Delete**；默认商品仅展示不可删。

上线前建议将商品与订单改为数据库存储，并在 API 与 Admin 路由中校验管理员 session。详见 [FEATURES.md](./FEATURES.md)。**当前不足与改进清单**见 [GAPS.md](./GAPS.md)。

## 技术栈

- Next.js 14 (App Router)、TypeScript、Tailwind CSS
- 购物车：CartContext；账户与角色：AuthContext（buyer / admin）
- 商品数据：`src/lib/data.ts`（默认） + `data/custom-products.json`（管理员新增），服务端用 `src/lib/server-data.ts` 合并后输出

## 本地运行

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

### 构建与部署（生产）

```bash
npm run build
npm run start
```

- 复制 **`.env.example`** 为 `.env`，填写 **`DATABASE_URL`**（PostgreSQL 连接串）、**`NEXTAUTH_SECRET`**（随机长字符串）、**`NEXT_PUBLIC_SITE_URL`**（正式域名，无末尾斜杠）。详见 **`docs/ENV-TEMPLATE.md`** 与 **`docs/POSTGRES-MIGRATION.md`**。
- 可选：**Resend**、**Stripe**（`sk_test_` / `sk_live_` 与对应 **`STRIPE_WEBHOOK_SECRET`**）、**`ADMIN_PASSWORD`**（seed 建管理员时用）见上文与 `docs/ENV-TEMPLATE.md`。
- 静态托管（如 **Vercel**）：连接仓库后配置相同环境变量，Build 命令 `npm run build`，Output 为 Next.js 默认。生产请使用托管 **PostgreSQL**（或连接池），勿依赖本地 SQLite 文件。

### E2E 冒烟测试（Playwright）

覆盖：首页、商品列表、**`?q=` 搜索**与无结果、**首页 WebSite JSON-LD**、404、购物车、未登录 Admin API 401、**登录 → 忘记密码链接**、**忘记密码提交后的统一成功提示**、**重置密码页无 token 提示**。测试固定 **`en-US`** 语言，避免系统中文环境导致文案断言失败。

首次在本机安装浏览器（只需一次）：

```bash
npx playwright install chromium
```

运行测试：Playwright 会在 **`3005`** 端口单独起一台 `next dev`（避免和你平时的 3000 冲突）。也可改端口：`PLAYWRIGHT_PORT=3010 npm run test:e2e`。

```bash
npm run test:e2e
```

交互调试：`npm run test:e2e:ui`  

指向已在运行的站点（例如本机 3000）：  
`PLAYWRIGHT_SKIP_WEBSERVER=1 PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e`  
（PowerShell：`$env:PLAYWRIGHT_SKIP_WEBSERVER=1; $env:PLAYWRIGHT_BASE_URL="http://localhost:3000"; npm run test:e2e`）

类型检查（无 emit）：`npm run typecheck`

### GitHub Actions（CI）

推送或 PR 时会运行 **[`.github/workflows/ci.yml`](./.github/workflows/ci.yml)**：`npm ci` → `prisma generate` → **`migrate deploy`** → **`db seed`** → `lint` → **`typecheck`** → **`next build`** → Playwright（Chromium）。CI 使用 **PostgreSQL 16** 服务容器与临时 `DATABASE_URL`，并注入临时的 `NEXTAUTH_SECRET`。

### 订单确认邮件（可选）

配置 [Resend](https://resend.com) 后，下单成功会向用户邮箱发送 HTML 确认信：

```env
RESEND_API_KEY=re_xxxx
# 发件人；未设置时使用 Resend 测试域：PrintFig <onboarding@resend.dev>
RESEND_FROM="PrintFig <orders@yourdomain.com>"
```

未配置 `RESEND_API_KEY` 时下单仍成功，仅不发送邮件。

**忘记密码**：登录页 **Forgot password?** → `/forgot-password` 提交邮箱；若账户存在且已配置 Resend，会收到重置链接（指向 **`NEXTAUTH_URL` 或 `NEXT_PUBLIC_SITE_URL`** 下的 `/reset-password?token=…`，1 小时内有效）。未配置 Resend 时接口仍返回成功，但不会发信（开发环境可看服务端日志）。**滥用防护**：`forgot-password` / `reset-password` API 对 IP 有进程内限流（约 10 / 15min 与 30 / 15min）；多实例部署需自行换共享存储限流。两页 **noindex**，`robots.txt` 已 disallow。

**发货通知**：管理员在后台将订单状态改为 **Shipped** 并保存时，若已配置 Resend，会向买家发送 **「Your order has shipped」** 邮件；若已填 **物流单号**，邮件内包含 **Track shipment** 按钮（承运商链接规则与「我的订单」一致）。同一订单仅在 **首次变为 Shipped** 时发信，避免重复保存重复发送。

### Google 登录（可选）

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → **OAuth 2.0 Client ID**（类型：Web）。
2. **已获授权的 JavaScript 来源**：`http://localhost:3000`、生产域名。  
   **已获授权的重定向 URI**：`http://localhost:3000/api/auth/callback/google` 与 `https://你的域名/api/auth/callback/google`。
3. 在 `.env` 中设置 **`GOOGLE_CLIENT_ID`**、**`GOOGLE_CLIENT_SECRET`**；生产环境务必设置 **`NEXTAUTH_URL`**（与站点一致，无末尾斜杠）。
4. 登录页会在检测到已配置 Google Provider 时显示 **Continue with Google**。

### Stripe 支付（可选）

配置 `STRIPE_SECRET_KEY` 后，结账页主按钮变为 **银行卡支付（Stripe）**，跳转 Stripe Checkout；支付成功后由 Webhook `checkout.session.completed` 创建订单（`status: paid`）并可选发送确认邮件。

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

本地调试 Webhook：

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

将 CLI 输出的 `whsec_...` 写入 `.env` 的 `STRIPE_WEBHOOK_SECRET`。未配置 Stripe 时行为与之前一致：仅 **提交订单**（`pending`），不跳转支付。

- **买家**：邮箱密码登录与注册（`POST /api/auth/register` 带 **IP 限流** 与邮箱/密码校验）；可选 **Google 登录**（配置 `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` + 生产环境 `NEXTAUTH_URL`）→ 我的账户、购物车、结账。
- **管理员**：**admin@printfig.com** 登录 → 出现 Admin → 可添加/编辑/删除自定义商品。

## 上线前重点（美国用户）

见 **[FEATURES.md](./FEATURES.md)**，主要包括：

- **真实认证**：NextAuth.js / Clerk 等，区分买家与管理员
- **支付**：Stripe（美国主流）
- **订单与订单追踪**：订单落库、状态流转、**物流单号 + 承运商链接**（USPS/UPS/FedEx），并在「我的订单」中展示
- **后台与权限**：Admin API 校验管理员 session；商品/订单可迁入 PostgreSQL 等

后续可做：后台订单管理、库存与预购逻辑、评价、愿望单、多语言/多币种等。
