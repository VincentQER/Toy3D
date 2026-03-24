# 后端交付长报告（P0-01 / P0-02）

**受众**：PM、架构、运维、前端联调  
**任务 ID**：P0-01（PostgreSQL 生产路径）、P0-02（安全配置与 Webhook）  
**责任**：后端 Agent  
**文档日期**：2026-03-23  

---

## 1. 执行摘要

本次交付将应用与 CI 的默认数据存储从 **SQLite** 切换为 **PostgreSQL**，补齐 **迁移与回滚** 的可执行说明；收敛 **Stripe Webhook** 的验签失败与履约失败行为，避免对外泄露内部错误；将 **环境变量、密钥与管理员密码轮换** 的约定写入模板文档。敏感信息**未**进入仓库。

---

## 2. 目标与完成度

| 合同目标 | 状态 | 说明 |
|----------|------|------|
| Prisma + PostgreSQL 迁移步骤（含命令顺序） | 完成 | `docs/POSTGRES-MIGRATION.md` |
| 环境变量清单（dev / staging / prod） | 完成 | `docs/ENV-TEMPLATE.md`、`/.env.example` |
| Webhook 验签流程完整（拒绝 + 日志） | 完成 | 见 `src/app/api/stripe/webhook/route.ts` 与 `docs/STRIPE-WEBHOOK-SECURITY.md` |
| 回滚方案（数据库 + 配置） | 完成 | `docs/ROLLBACK-PRODUCTION.md` |
| 接口契约同步 | 完成 | `docs/接口契约变更说明.md` |
| Out of Scope：不改前端页面、不新增税务/评论/库存等 | 遵守 | 仅同步 README / FEATURES 等事实描述 |

---

## 3. 改动文件清单

### 3.1 Prisma 与数据

- `prisma/schema.prisma` — `provider = "postgresql"`（URL 由 `prisma.config.ts` 的 `DATABASE_URL` 提供，符合 Prisma 7）
- `prisma/migrations/migration_lock.toml` — `provider = "postgresql"`
- `prisma/migrations/20260323120000_postgresql_init/migration.sql` — **新增** PostgreSQL 基线迁移（合并原 SQLite 多文件结构）
- **删除** 原 SQLite 迁移目录下的 `migration.sql`（共 4 个历史迁移；历史仍可从 Git 查看）

### 3.2 运行时与脚本

- `src/lib/db.ts` — `@prisma/adapter-pg` + `PrismaPg`，`connectionString` / `max`（`PG_POOL_MAX`）
- `prisma/seed.ts` — 复用 `@/lib/db`，去掉本地 SQLite adapter 重复实现

### 3.3 API

- `src/app/api/stripe/webhook/route.ts` — 验签与履约日志、500 响应体收紧

### 3.4 依赖

- `package.json`、`package-lock.json` — 移除 `better-sqlite3`、`@prisma/adapter-better-sqlite3`；新增 `@prisma/adapter-pg`

### 3.5 CI

- `.github/workflows/ci.yml` — PostgreSQL 16 service、`DATABASE_URL` 指向 CI 库

### 3.6 文档与模板

- `docs/POSTGRES-MIGRATION.md`（新建）
- `docs/ENV-TEMPLATE.md`（新建）
- `docs/STRIPE-WEBHOOK-SECURITY.md`（新建）
- `docs/ROLLBACK-PRODUCTION.md`（新建）
- `docs/接口契约变更说明.md`（新建）
- `.env.example`（补充 `DATABASE_URL`、`PG_POOL_MAX`、`ADMIN_*`、Stripe 说明）
- `README.md`、`FEATURES.md` — 与 PostgreSQL 现状对齐
- `.gitignore` — 注释更新（`ci.sqlite` 为遗留说明）

---

## 4. 接口最终契约：`POST /api/stripe/webhook`

**请求**

- **Method / Path**：`POST /api/stripe/webhook`
- **Body**：Stripe 发送的 **原始** JSON 字符串（须保持未改写的 raw body）
- **Headers**：`stripe-signature`（必填，用于验签）

**响应（JSON）**

| HTTP | 响应体 | 条件 |
|------|--------|------|
| **200** | `{ "received": true }` | 验签通过；非 `checkout.session.completed` 或该事件处理成功 |
| **400** | `{ "error": "Missing stripe-signature" }` | 缺少 `stripe-signature` |
| **400** | `{ "error": "Invalid signature" }` | `constructEvent` 验签失败 |
| **500** | `{ "error": "Webhook not configured" }` | 已配置 `STRIPE_SECRET_KEY` 但未配置 `STRIPE_WEBHOOK_SECRET` |
| **500** | `{ "error": "Fulfillment failed" }` | 事件为 `checkout.session.completed` 且履约逻辑抛错（详情仅服务端日志，含 `eventId`、`sessionId`） |
| **503** | `{ "error": "Stripe not configured" }` | 未配置 `STRIPE_SECRET_KEY` |

**说明**：其他业务 REST 接口本次**未**改路径与契约；详见 `docs/接口契约变更说明.md`。

---

## 5. PostgreSQL 迁移（执行简版）

1. 准备可访问的 PostgreSQL 实例与 `DATABASE_URL`（生产建议 `sslmode` 等按云厂商文档）。
2. `npm ci` → `npx prisma generate` → `npx prisma migrate deploy` → `npx prisma db seed`（按需）。
3. `npm run build` / 部署：构建阶段若页面预渲染会查库，**构建机须能连上已 migrate 的数据库**（见 `docs/POSTGRES-MIGRATION.md` §6）。
4. 自 **SQLite 生产**迁出：维护窗口 + 新库跑迁移 + 数据导出/导入与校验（外键顺序、订单与 Session 幂等字段），**不可**假设旧 `_prisma_migrations` 与当前 PG 基线连续。

**详细版**：`docs/POSTGRES-MIGRATION.md`。

---

## 6. 回滚（简版）

- **配置**：将 `DATABASE_URL`、`STRIPE_*`、`NEXTAUTH_SECRET` 等改回上一已知良好值并重新部署。
- **数据库**：优先用托管方**快照 / 时间点恢复**；勿随意删除生产 `_prisma_migrations`。
- **代码层回退 SQLite**：需 `git` 回退到仍含 SQLite 与 `better-sqlite3` 的历史提交并恢复数据路径——**仅作应急**，见 `docs/ROLLBACK-PRODUCTION.md`。

---

## 7. Webhook 验签与安全审查结论

**通过项**

- 使用 `getStripe().webhooks.constructEvent(body, sig, webhookSecret)`，body 为 **raw text**。
- 无 `STRIPE_WEBHOOK_SECRET` 时不验签、返回 500 并打错误日志。
- 无 `stripe-signature` → 400 + 日志；验签失败 → 400 + 日志（不向客户端返回堆栈）。
- 履约失败 → 500 固定文案，内部细节仅日志。

**风险与缓解（摘要）**

- 多实例日志分散 → 建议集中日志，按 `eventId` 检索。
- Serverless 连接池 → 可调 `PG_POOL_MAX` 或使用云厂商连接池 / PgBouncer（见 `docs/ENV-TEMPLATE.md`）。

**详细版**：`docs/STRIPE-WEBHOOK-SECURITY.md`。

---

## 8. 验证与测试

- **已通过（本地无 DB 条件下）**：`prisma validate`、`prisma generate`、`npm run lint`、`npm run typecheck`。
- **须在具备 PostgreSQL 的环境复验**：`prisma migrate deploy`、`db seed`、`npm run build`、Stripe CLI 或 Dashboard 对测试端点投递 Webhook。
- **CI**：流水线已配置 Postgres 服务；合并后应以 Actions 绿为准。

---

## 9. 风险登记

| 等级 | 内容 |
|------|------|
| **高** | 全员与流水线依赖 PostgreSQL；未配 `DATABASE_URL` 或库不可达会导致 dev/build 失败。 |
| **中** | 迁移历史为 **PG 新基线**，与旧 SQLite 迁移链不连续；生产割接需备份、窗口与数据校验。 |
| **中** | 依赖解析 Webhook `500` 响应 `error` 正文的监控需改为依赖状态码或 Stripe 控制台。 |
| **低** | 本机无 Postgres 时 `next build` 失败不代表类型错误，应以 CI/staging 为准。 |

---

## 10. 建议 PM 关注的单一后续动作

在 **staging** 使用托管 PostgreSQL，严格按 `docs/POSTGRES-MIGRATION.md` 跑通 **migrate → seed → build**，并用 Stripe **测试模式** 完成一次真实 Webhook 投递与订单履约验收，再排产生产割接窗口。

---

## 11. 参考索引

| 主题 | 路径 |
|------|------|
| 迁移执行 | `docs/POSTGRES-MIGRATION.md` |
| 环境变量 | `docs/ENV-TEMPLATE.md`、`/.env.example` |
| 回滚 | `docs/ROLLBACK-PRODUCTION.md` |
| Webhook 安全 | `docs/STRIPE-WEBHOOK-SECURITY.md` |
| 接口契约变更 | `docs/接口契约变更说明.md` |
