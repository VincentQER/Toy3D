# 环境变量模板与说明（P0-01 / P0-02）

**禁止**将真实密钥提交到仓库。复制 `.env.example` 为 `.env` 并本地填写；在托管平台（Vercel 等）用控制台配置同名变量。

图例：**必填** / *按环境* / （可选）

---

## 1. 汇总表

| 变量 | dev | staging | prod | 说明 |
|------|-----|---------|------|------|
| `DATABASE_URL` | 必填 | 必填 | 必填 | PostgreSQL 连接串（见下节格式） |
| `PG_POOL_MAX` | 可选 | 可选 | 可选 | `pg` 池上限，默认 `10`；Serverless 宜偏小 |
| `NEXTAUTH_SECRET` | 必填* | 必填 | 必填 | 随机长密钥，用于 JWT / session 加密 |
| `NEXTAUTH_URL` | 可选* | 建议 | 必填 | 站点根 URL，无尾斜杠；OAuth/邮件链接依赖 |
| `NEXT_PUBLIC_SITE_URL` | 建议 | 建议 | 必填 | canonical、sitemap、OG |
| `ADMIN_EMAIL` | 可选 | 可选 | 建议 | `db seed` 创建管理员邮箱，默认 `admin@printfig.com` |
| `ADMIN_PASSWORD` | 可选 | **强密码** | **强密码** | 仅当库中**尚无**该管理员时 seed 使用；轮换见下 |
| `STRIPE_SECRET_KEY` | 可选 | `sk_test_…` | `sk_live_…` | 未设置则走演示下单 |
| `STRIPE_WEBHOOK_SECRET` | 可选 | `whsec_…` | `whsec_…` | Dashboard 或 `stripe listen`；须与密钥环境一致 |
| `RESEND_API_KEY` | 可选 | 可选 | 可选 | 订单/重置密码邮件 |
| `RESEND_FROM` | 可选 | 可选 | 可选 | 发件人 |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | 可选 | 可选 | 可选 | Google 登录 |

\* 本地纯调试可临时使用占位，**生产与 staging 必须使用加密级随机 `NEXTAUTH_SECRET`**。

---

## 2. `DATABASE_URL` 格式示例（非真实密码）

```env
# 本地 Docker
DATABASE_URL=postgresql://printfig:devlocal@127.0.0.1:5432/printfig

# 云厂商（常见需要 SSL）
DATABASE_URL=postgresql://USER:PASSWORD@HOST.compute.amazonaws.com:5432/DBNAME?sslmode=require
```

---

## 3. `NEXTAUTH_SECRET` 生成示例

```bash
# macOS / Linux
openssl rand -base64 32

# PowerShell（.NET）
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

长度建议 ≥ 32 字符。轮换：生成新 secret → 配置平台 → 重新部署；**所有用户 session 会失效**，需重新登录。

---

## 4. Stripe 测试与正式

| 环境 | `STRIPE_SECRET_KEY` | `STRIPE_WEBHOOK_SECRET` |
|------|---------------------|---------------------------|
| 本地/CI | `sk_test_…` 或不配置 | `stripe listen` 输出的 `whsec_…` |
| Staging | `sk_test_…` | Stripe Dashboard **测试模式** 端点 secret |
| Production | `sk_live_…` | Dashboard **正式模式** 端点 secret |

**Webhook URL** 必须指向公网可访问的 `https://你的域名/api/stripe/webhook`，且与当前模式的密钥一致。

---

## 5. 管理员密码轮换（无新功能，仅流程）

1. **首选**：使用站内「忘记密码」（若管理员邮箱可收信且已配置 Resend）。
2. **受控环境**：在维护窗口设置 `ADMIN_PASSWORD` 为新强密码，**删除库中该管理员用户**后执行 `npx prisma db seed` 仅重建该账户（会丢失该用户关联订单外键——若订单必须保留，勿删用户，改用 bcrypt 更新 `passwordHash` 的运维脚本或 Prisma Studio + 手工哈希）。
3. **推荐长期做法**：单独运维脚本：`bcrypt.hash(newPassword)` 后 `prisma.user.update({ where: { email }, data: { passwordHash } })`，不依赖 seed。

---

## 6. 与 `.env.example` 的关系

根目录 `.env.example` 提供可提交的**占位模板**；详细语义与分环境建议以本文档为准。
