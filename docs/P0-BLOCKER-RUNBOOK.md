# P0 Blocker 清零运行手册（6 项验收）

按顺序执行；**全部通过**方可进入上线窗口。

---

## 1) Staging `DATABASE_URL` 与构建机连库

1. 在托管平台（如 Vercel）为 **Preview / Staging** 环境设置  
   `DATABASE_URL=postgresql://...`（与生产库隔离）。
2. 确认连接串可从 **Build** 与 **Runtime** 访问（防火墙 / IP 允许列表 / `sslmode`）。
3. **证据**：平台环境变量截图（可打码密码）或构建日志中出现 `prisma migrate deploy` 成功行。

**本地等价**：`docker compose up -d` 后使用  
`DATABASE_URL=postgresql://printfig:devlocal@127.0.0.1:5432/printfig`。

---

## 2) `prisma migrate deploy` + `prisma db seed`

在设置好 `DATABASE_URL` 的 shell 中（仓库根目录）：

```bash
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

**证据**：终端完整输出（含 “Applied migration” / “Seeded”）。

**一键（含 build）**：`npm run p0:verify`（需已 `npm ci` 且 `DATABASE_URL` 已导出）。

---

## 3) Admin layout（`location is not defined`）

已由代码修复：`src/app/admin/layout.tsx` 使用 `useSession` + **`useEffect` 内** `router.replace`，不在渲染期调用；加载态使用 `admin.sessionLoading`。

**证据**：`npm run build` 不再在 `/admin/*` 预渲染报 `ReferenceError: location is not defined`。

---

## 4) `npm run build` 成功

```bash
set DATABASE_URL=postgresql://...   # Windows CMD
npm run build
```

**证据**：日志末尾 `✓ Compiled successfully` / `Route (app)` 汇总且无 `Export encountered errors`。

---

## 5) Stripe Webhook 实投与 Event ID

1. Staging 配置 `STRIPE_SECRET_KEY`（test）与 **同一模式** 的 `STRIPE_WEBHOOK_SECRET`。
2. Dashboard 添加端点：`https://<staging>/api/stripe/webhook`，或使用  
   `stripe listen --forward-to localhost:3000/api/stripe/webhook`。
3. 触发事件（如测试支付完成或 `stripe trigger checkout.session.completed`，需 payload 与履约逻辑匹配）。

**证据**：Stripe Dashboard → Webhooks → 该投递详情中的 **Event ID**（`evt_...`）及 HTTP **200**。

---

## 6) 一单订单状态流转

任选可复现路径，例如：

- 后台将某订单 **pending → paid → shipped**（或等价状态），或  
- 导出 SQL / Prisma 日志显示 `Order.status` 更新前后值。

**证据**：管理后台截图（含订单号与状态）或脱敏服务端日志行。

---

## 当前仓库内自动化已验证（无数据库）

- `npm run typecheck` — 通过  
- `npm run lint` — 通过  

（见 `reports/P0-blocker-evidence.md`。）
