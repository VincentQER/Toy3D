# 当前项目需要弥补的点 (Gaps to Address)

针对目前 PrintFig 的流程与实现，建议按优先级弥补以下内容。

---

## 一、安全与权限（优先）

| 问题 | 说明 | 建议 |
|------|------|------|
| **Admin API 无鉴权** | ~~曾存在~~ 已处理：`/api/admin/products`、`/api/admin/orders` 使用 `requireAdminSession()`（`src/lib/admin-auth.ts`），并**以数据库 `user.role` 为准**，不单独信任 JWT。 | 生产环境可再加 Admin API Key 或 IP 限制。 |
| **前端角色可伪造** | Admin 布局仍用客户端 `isAdmin` 做 UI 门禁（体验用）；**敏感操作以 API 的 DB 角色校验为准**。 | 勿仅依赖前端隐藏按钮；所有写操作已在服务端校验。 |
| **敏感配置** | 管理员邮箱等写在代码或环境变量，易泄露或误改。 | 统一用 `NEXT_PUBLIC_*` / `ADMIN_*` 等环境变量，并在 README 中说明。 |

---

## 二、数据与持久化

| 问题 | 说明 | 建议 |
|------|------|------|
| **商品存 JSON 文件** | `data/custom-products.json` 单文件写入，无并发控制，易丢数据。 | 上线前迁到数据库（如 PostgreSQL + Prisma）；保留当前 JSON 仅作开发/演示。 |
| **购物车不持久** | ~~已用 `localStorage`（`printfig-cart-v1`）在刷新后恢复~~；登录用户未与服务器同步。 | 后续可做登录后合并服务端购物车。 |
| **无订单持久化** | ~~订单已落库（Prisma）~~；Stripe 支付成功由 Webhook 建单。 | 继续完善状态流转与物流字段。 |

---

## 三、体验与边界情况

| 问题 | 说明 | 建议 |
|------|------|------|
| **html lang 固定** | 根布局写死 `lang="zh-CN"`，切换英文后对无障碍/SEO 不友好。 | 根据当前 locale 动态设置 `<html lang="en">` 或 `lang="zh-CN"`（见下方实现）。 |
| **无自定义 404** | 未找到页面用 Next 默认 404。 | 增加 `app/not-found.tsx`，风格与本站一致，并带「返回首页」等入口。 |
| **列表无分页** | ~~`/products` 每页 24 条；**无搜索且排序为「最新 / 名称」时**已用 Prisma `count` + `skip`/`take`~~；有 `q` 或按价格排序时仍内存筛选/排序（可再优化 SQL）。 | 价格排序、全文搜索与 DB 对齐。 |
| **无商品搜索** | ~~列表已支持 `q`，且关键词进 Prisma `OR contains`~~。 | 大规模时可上 FTS / 托管搜索。 |
| **Admin 表单反馈弱** | 商品表单、商品列表删除、订单列表保存均已用顶部 **`role="alert"`** 展示错误。 | 可抽成共用 `AdminFormAlert` 组件。 |
| **无图片上传** | 商品图只能填 URL。 | 后续可接图床（如 S3、Cloudinary），Admin 支持本地上传。 |

---

## 四、SEO 与多语言

| 问题 | 说明 | 建议 |
|------|------|------|
| **metadata 未按语言切换** | `layout.tsx` 里 title/description 固定中文。 | 按 locale 或路由生成多语言 metadata（或为各语言做不同 layout/segment）。 |
| **无结构化数据** | ~~详情 / 列表 / 首页 JSON-LD 已齐~~；Organization 支持 **env：`NEXT_PUBLIC_ORGANIZATION_LOGO`、`NEXT_PUBLIC_ORGANIZATION_SAME_AS`**。 | Rich Results 校验。 |

---

## 五、代码与工程

| 问题 | 说明 | 建议 |
|------|------|------|
| **无自动化测试** | Playwright 冒烟含首页、商品列表、**`?q=` 搜索**、无结果态、**首页 WebSite JSON-LD**、404、购物车、Admin API 401、**忘记密码页提交成功提示**、**重置密码页无 token 提示**、登录页链到 forgot-password。 | 结账、登录后路径等可再补。 |
| **无 Error Boundary** | 某组件抛错可能导致整页白屏。 | 在 layout 或关键路由加 React Error Boundary，展示友好错误页。 |
| **API 入参未严格校验** | 忘记/重置密码、**注册**、**Admin 商品**、**下单**（`validateCartLines` + `validateShippingFields` + 用户级限流）已加强。 | Webhook 与其它边缘路由可再引入 zod。 |

---

## 六、运维与部署

| 问题 | 说明 | 建议 |
|------|------|------|
| **无部署说明** | ~~README「构建与部署」~~；~~GitHub Actions CI~~（lint / typecheck / build / migrate / seed / Playwright）。 | 按托管平台补生产库与密钥。 |
| **JSON 无备份** | 直接改 `custom-products.json`，误操作难恢复。 | 定期备份或迁到 DB 后做备份策略。 |

---

## 已补上的小项（本轮）

- **html lang 随语言切换**：在 `LocaleProvider` 内用 `useEffect` 根据 `locale` 设置 `document.documentElement.lang`（`en` / `zh-CN`），便于无障碍与 SEO。
- **自定义 404 页**：新增 `app/not-found.tsx`，风格与本站一致，提供「Back to home」与「Browse products」链接。
- **Admin API 鉴权**：`requireAdminSession()` 校验登录并以 **数据库 `role === admin`** 为准（`src/lib/admin-auth.ts`）。
- **购物车 localStorage**：`CartContext` 在客户端恢复/保存 `printfig-cart-v1`。
- **E2E**：未登录访问 `GET /api/admin/products` 期望 `401`；商品搜索与首页 JSON-LD、**忘记密码 / 重置密码（无 token）**、登录页忘记密码链接等见 `e2e/smoke.spec.ts`。
- **忘记密码流程**：`/forgot-password` + `/reset-password?token=…` + Resend 邮件（可选）；见 `FEATURES.md` / `README`。
- **Admin 商品 API 校验**：`normalizeProductSlug` + `validateAdminProductPayload`；写入前检查 **slug 全局唯一**（含更新时排除自身）。
- **订单与结账校验**：`validateCartLines`（变体价以库为准、行数≤50、每行数量整数 1–99、总价上限）、`validateShippingFields`、`post-order` / `stripe-checkout` 用户级限流。
- **Stripe Webhook 建单**：`fulfillCheckoutSession`（`src/lib/stripe-fulfill-checkout.ts`）解析 metadata 后再次校验购物车与金额，避免仅信 metadata。
- **GitHub Actions CI**：`.github/workflows/ci.yml`；`npm run typecheck`（`tsc --noEmit`）。
- **商品页 JSON-LD**：Schema.org `Product` + `Offer`；**`BreadcrumbList`**（Home → Products → Brand → 角色 → 商品，与可视面包屑一致）。
- **商品列表分页**：每页 24 条、`?page=` 与筛选/排序联动；改筛选会回到第 1 页。
- **商品列表 ItemList JSON-LD**：当前页 `ItemList` + 嵌套 `Product`（`url`、绝对 `image`）；多页时 `description` 注明总匹配数与页码。
- **列表 DB 分页**：`filterProductsPaged` — 默认「最新」/「名称 A–Z」且无关键词时在数据库分页；类型/品牌/角色始终进 `where`。
- **首页站点 JSON-LD**：`@graph` 含 `Organization`、`WebSite`，`SearchAction` 指向 `{SITE}/products?q={search_term_string}`。
- **商品搜索**：关键词合并进 `buildCombinedProductListWhere`，与「最新 / 名称」排序共用 DB 分页；价格排序仍内存排。
- **Organization 增强**：可选环境变量 `logo`、`sameAs`（多社交链接）。

其余项可按 FEATURES.md 的上线顺序（认证 → 支付 → 订单 → 订单追踪）与本文档优先级逐步补齐。
