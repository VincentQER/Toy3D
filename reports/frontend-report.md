# 前端报告 — P0-03-FE（下单与订单查看体验闭环）

**任务 ID**：P0-03-FE  
**角色**：前端 Agent  
**日期**：2025-03-23  

---

## 改动文件

| 路径 | 说明 |
|------|------|
| `src/components/checkout-api-error.ts` | 新建：HTTP 状态 + `error` 文案 → 固定翻译 key，避免裸暴露后端信息 |
| `src/app/checkout/page.tsx` | 结账：`aria-busy`、`aria-live`；Stripe / 普通下单失败走映射；异常统一为网络类提示 |
| `src/app/checkout/success/CheckoutSuccessClient.tsx` | 加载 / 缺失 / 成功 / 失败 / `unpaid`；失败可重试；Suspense fallback 文案化 |
| `src/app/account/orders/page.tsx` | 加载 / 错误+重试 / 空 / 列表；状态徽章配色；日期本地化；追踪链接无障碍 |
| `src/lib/translations.ts` | checkout / accountOrders 新增键（en/zh/es） |
| `src/lib/shipping-tracking.ts` | DHL 追踪 URL 调整为 global Express + `tracking-id` |

---

## 各页面改动说明

1. **Checkout**：失败不再用 `catch` 展示可能含后端细节的 `message`；按状态码与映射展示统一话术。  
2. **Checkout success（Stripe）**：区分未付款与校验失败；失败可重试 `session-status`。  
3. **My orders**：`!res.ok` 不再伪装成空列表；错误态 + 重试；状态可视化与追踪 `sr-only` 新标签说明。

---

## 自测清单（含边界）

1. 登录 + 有车 → `/checkout`，Stripe 配置未返回前按钮禁用。  
2. 无 Stripe → `POST /api/orders` 成功 → `/account/orders?created=…`。  
3. 断网或 400 → 仅映射/网络类文案，无堆栈。  
4. 429 → 限流类文案。  
5. Stripe 成功回跳 → 加载 → 成功，购物车清空。  
6. 无效 `session_id` → 错误 + 重试 + 我的订单。  
7. `payment_status === unpaid` → 未付款引导。  
8. 订单列表：加载、错误+重试、空、有数据。  
9. 追踪：USPS/UPS/FedEx/DHL 关键字 + 无 carrier 时 Google fallback。

**自测结果**：改动文件无新增 lint 问题；全仓 `tsc` 可能因既有 `db.ts` 依赖报错（非本次引入）。

---

## 与后端字段对齐

| 场景 | 依赖 |
|------|------|
| 普通下单 | `POST /api/orders` → `orderId?`, `error?`；401/429/400/5xx |
| Stripe | `POST /api/stripe/checkout-session` → `url?`, `error?` |
| 支付成功页 | `GET /api/stripe/session-status` → `paymentStatus` |
| 我的订单 | `GET /api/orders/user` → `id`, `date`, `total`, `status`, `trackingNumber`, `carrier` |

---

## 未解决问题与阻塞

- 全仓 `tsc`：`src/lib/db.ts` 与 `@prisma/adapter-pg` / `pg` 为仓库既有问题。  
- `session-status` 400 响应体可能含技术信息；前端不展示，仅统一错误文案。  
- DHL 各产品线入口可能不同；异常单号依赖 Google fallback。

---

## 风险（高 / 中 / 低）

- **低**：未命中映射的后端文案落到通用错误。  
- **中**：承运商字符串需包含 `ups`/`usps` 等子串，DHL 深链因地区/产品线可能有差异。  
- **低**：未知 `status` 显示原文 + 默认灰徽章。

---

## 待 PM 决策

- 未知订单 `status` 是否改为统一「其他」类文案而非英文枚举原文。  
- 是否接受 `src/lib` 内文案与追踪 URL 变更（若合同严格限定仅 `app`+`components`）。

---

## 验收对照

- [x] checkout → 订单主路径可演示  
- [x] 关键页具备加载 / 空 / 错（success 含 missing、unpaid、error）  
- [x] 追踪链接可跳转（四家 + Google）  
- [x] 无新增高优先级前端 lint 问题（已检改动文件）
