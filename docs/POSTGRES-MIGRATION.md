# PostgreSQL 迁移执行说明（P0-01）

本文档描述从 **生产环境 SQLite** 切到 **PostgreSQL** 的可复现步骤。仓库内 Prisma `provider` 已统一为 `postgresql`；本地与 CI 也需使用 PostgreSQL（不再使用 `file:` SQLite）。

---

## 1. 前置条件

- 已安装 **Node 20+**、**npm**。
- 一台可访问的 **PostgreSQL 14+**（建议 16），具备建库与迁移账号。
- 生产部署平台能配置 **环境变量**（含 `DATABASE_URL`），且构建/运行阶段均可读取。

---

## 2. 命令顺序（空库 / 新环境）

在应用仓库根目录执行（与 CI 一致）：

```bash
# 1) 安装依赖
npm ci

# 2) 写入 .env：至少设置 DATABASE_URL（见 docs/ENV-TEMPLATE.md）
# Windows PowerShell 示例：
# $env:DATABASE_URL = "postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require"

# 3) 生成 Client
npx prisma generate

# 4) 应用迁移（创建表结构）
npx prisma migrate deploy

# 5) 种子数据（管理员 + 默认商品，可选自定义 JSON）
npx prisma db seed

# 6) 构建（验证类型与 Next 编译）
npm run build
```

**Windows（路径含中文/非 ASCII 时）：** 若便携版 `initdb` 报找不到二进制，请将 `pgsql` 解压到 **仅 ASCII 的路径**（例如 `C:\printfig-staging-pg\pgsql`），再在该目录旁初始化 `pgsql-data` 并启动；`DATABASE_URL` 指向 `127.0.0.1` 与所选端口即可。

**注意：**

- `migrate deploy` 适用于**已有迁移历史**的环境；本仓库当前基线迁移为 `20260323120000_postgresql_init`。
- 若数据库里**已存在同名表**且非本次迁移创建，请先处理冲突或换空库。

---

## 3. 本地开发用 PostgreSQL（推荐）

使用 Docker 快速起库（示例）：

```bash
docker run --name printfig-pg -e POSTGRES_USER=printfig -e POSTGRES_PASSWORD=devlocal -e POSTGRES_DB=printfig -p 5432:5432 -d postgres:16
```

`.env` 中：

```env
DATABASE_URL=postgresql://printfig:devlocal@localhost:5432/printfig
```

然后执行第 2 节步骤 3–6。

---

## 4. 从现有 SQLite 生产数据迁出（有历史数据时）

本仓库**不再**随代码携带 SQLite 迁移 SQL；旧版 SQLite 迁移可在 **Git 历史** 中查看。

推荐策略：

1. **维护窗口**：停写或只读应用，避免双写。
2. **结构**：在新 PostgreSQL 上执行第 2 节 `migrate deploy`（空库得到与线上一致的 Prisma 模型）。
3. **数据**（择一或组合）：
   - **小型库**：用脚本通过 Prisma / `sqlite3` 导出 CSV，再 `COPY` 进 PostgreSQL（注意外键顺序：`User` → `Product` / `Order` → `OrderItem` / `Address` / `PasswordResetToken`）。
   - **工具**：评估 [pgloader](https://pgloader.io/) 等从 SQLite 到 PostgreSQL 的迁移工具（需校验类型与布尔值）。
4. **校验**：行数对比、抽样订单与用户、Stripe `stripeCheckoutSessionId` 唯一性。
5. **切换**：将生产 `DATABASE_URL` 指向新库，部署新版本应用，观察日志与支付 Webhook。

详细回滚见 [ROLLBACK-PRODUCTION.md](./ROLLBACK-PRODUCTION.md)。

---

## 5. 与 Prisma 配置的衔接

- `prisma/schema.prisma`：`provider = "postgresql"`（连接 URL 由 Prisma 7 放在 `prisma.config.ts` 的 `datasource.url`，与 `DATABASE_URL` 一致）。
- `prisma.config.ts`：从 `process.env.DATABASE_URL` 读取，供 `migrate` / `db seed` 使用。
- 运行时通过 `src/lib/db.ts` 使用 `@prisma/adapter-pg`（内部 `pg` 连接池，`PG_POOL_MAX` 控制 `max`）。

---

## 6. `next build` 与数据库

Next.js 会在构建阶段对部分页面做预渲染；若这些页面通过 Prisma 读库，**构建机上的 `DATABASE_URL` 必须指向一台可达的 PostgreSQL**（表结构已通过 `migrate deploy` 创建）。仅执行 `tsc` / `lint` 时不一定连库；**CI** 已按「Postgres 服务 → migrate → seed → build」顺序配置。

---

## 7. 常见故障

| 现象 | 处理 |
|------|------|
| `DATABASE_URL is not set` | 在运行 `next dev` / `next start` / `prisma db seed` 前导出或写入 `.env`。 |
| SSL 错误（托管云数据库） | 在 URL 中加 `?sslmode=require`（以云厂商文档为准）。 |
| 连接数耗尽 | 降低 `PG_POOL_MAX` 或使用连接池er（如 PgBouncer）；见 ENV 模板。 |
| `migrate deploy` 报迁移已应用 | 正常；勿在已部署环境随意删 `_prisma_migrations` 表。 |

---

## 8. 历史 SQLite 说明

若需回顾旧 SQLite 迁移文件，使用：

```bash
git log --oneline -- prisma/migrations
git show <commit>:prisma/migrations/...
```

新环境请**不要**混用旧 SQLite 迁移与当前 PostgreSQL 迁移目录。
