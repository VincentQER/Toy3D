# 生产回滚方案（P0-01 / P0-02）

分为 **数据库** 与 **配置/应用** 两部分。执行前确认维护窗口与备份可用。

---

## A. 数据库回滚

### A1. 迁移失败或错连（尚未切换流量）

1. **停止**向错误数据库写入的部署实例（下线新版本或改只读）。
2. 若误对**空库**执行了 `migrate deploy`：可直接删除该库或 `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` 后重跑正确流程（见 `POSTGRES-MIGRATION.md`）。
3. 若迁移**半失败**（极少见）：不要手工删 `_prisma_migrations` 除非明确知道后果；优先用**快照还原**（RDS 快照、托管云「时间点恢复」）。

### A2. 已切 PostgreSQL 后需退回 SQLite（不推荐）

当前代码已以 **PostgreSQL** 为唯一支持的数据库驱动路径。若要退回 SQLite：

1. `git revert` 到仍使用 SQLite + 旧迁移的提交（或从备份分支检出）。
2. 恢复旧 `prisma/migrations` 与 `schema.prisma`（`provider = "sqlite"`）及 `db.ts` 中的 SQLite adapter。
3. 重新 `npm ci`、`prisma generate`、`migrate deploy`（SQLite `file:`）、部署。

**数据**：需事先从 PostgreSQL 导出并导入 SQLite（工具与脚本需自行验证），否则仅结构回退无意义。

### A3. 配置错误 `DATABASE_URL`

- **症状**：应用启动报 `DATABASE_URL is not set` 或连接超时。
- **操作**：在平台将 `DATABASE_URL` 改回**上一版已知良好**的连接串 → 重新部署或重启实例；无需改代码。

---

## B. 配置与密钥回滚

### B1. `NEXTAUTH_SECRET` 误轮换

- **现象**：所有用户被登出、session 无效。
- **操作**：在托管平台将 `NEXTAUTH_SECRET` 改回上一版值并重新部署。**注意**：若已泄露旧 secret，应视为泄露事件，改回仅作短暂止血，随后应换新 secret 并强制全员重登。

### B2. Stripe Live Key / Webhook Secret 错误

- **现象**：结账失败、Webhook 全部 400/500。
- **操作**：在 Dashboard 确认当前模式（test/live）→ 将 `STRIPE_SECRET_KEY` 与 `STRIPE_WEBHOOK_SECRET` 改回**上一组可用值** → 部署。Webhook URL 变更时需在 Stripe 后台同步端点。

### B3. Webhook 行为变更（履约错误响应）

- 若新版本仅收紧了错误响应（不暴露内部错误信息），一般**无需**回滚；Stripe 重试策略不变。
- 若需回滚应用：部署上一稳定构建即可，**无需**改 Stripe 端点。

### B4. 管理员无法登录

- 优先 **忘记密码** 流程；或使用运维脚本直接更新 `User.passwordHash`（见 `ENV-TEMPLATE.md` 管理员密码轮换）。

---

## C. 建议的发布前检查

- 生产 `DATABASE_URL` 在 **staging** 已跑通 `migrate deploy` + `db seed` +  smoke 支付（test mode）。
- Stripe **live** Webhook 与 **live** secret 配对，并在 Dashboard 看到近期 **200** 投递。

---

## D. 联系人 / 运行手册

- 迁移步骤：`docs/POSTGRES-MIGRATION.md`
- 环境变量：`docs/ENV-TEMPLATE.md`
- Webhook 安全：`docs/STRIPE-WEBHOOK-SECURITY.md`
