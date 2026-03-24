# Stripe Webhook 安全检查结果（P0-02）

**检查范围**：`POST /api/stripe/webhook`（`src/app/api/stripe/webhook/route.ts`）、`src/lib/stripe.ts`、与履约相关的 `stripe-fulfill-checkout`。

---

## 通过项

| 项 | 说明 |
|----|------|
| 验签 | 使用 `stripe.webhooks.constructEvent(body, rawSignature, STRIPE_WEBHOOK_SECRET)`，请求体为 **raw text**，未先 `JSON.parse`。 |
| Secret 必填 | 未配置 `STRIPE_WEBHOOK_SECRET` 时返回 **500** 并打 `console.error`，避免无 secret 时误接收。 |
| Stripe 未启用 | 无 `STRIPE_SECRET_KEY` 时返回 **503**，不进入验签。 |
| 缺少签名头 | 无 `stripe-signature` 时返回 **400**，并记录 `console.warn`（不记录 body）。 |
| 验签失败 | 捕获异常，返回 **400** `Invalid signature`，日志仅记录 `message`，**不**把堆栈返回给客户端。 |
| 事件处理失败 | 履约异常返回 **500**，响应体为固定文案 `Fulfillment failed`；服务端日志含 `eventId`、`sessionId` 与错误信息，便于对账与 Stripe 后台重试。 |

---

## 风险项与缓解

| 级别 | 风险 | 缓解建议 |
|------|------|----------|
| **中** | 多实例 / Serverless 下日志分散 | 接入集中日志（如 Vercel Logs、Datadog），按 `eventId` 检索。 |
| **中** | 500 时 Stripe 会重试，若因**持久化故障**长期失败 | 监控 Webhook 失败率；数据库与幂等逻辑保持与 `stripeCheckoutSessionId` 一致。 |
| **低** | `constructEvent` 前 body 被中间件改动会导致验签失败 | 确保该路由不经过会改写 body 的中间件；Next App Router 默认 `request.text()` 为原始流。 |
| **低** | 测试与 live 密钥混用 | 分环境 `STRIPE_*`，Webhook 端点按模式分别配置（见 `docs/ENV-TEMPLATE.md`）。 |

---

## 验收对照

- 验签失败 → **400** + 服务端错误日志，**不**创建订单。
- 配置缺失 → **500/503** 明确场景，不把密钥写入响应。

---

## 相关代码入口

- Webhook：`src/app/api/stripe/webhook/route.ts`
- Stripe 客户端：`src/lib/stripe.ts`
