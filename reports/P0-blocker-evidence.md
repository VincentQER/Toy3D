# P0 Blocker 证据回传（模板 + 本机已跑项）

**验收口径**：6 项全通过 ⇒ Go；任一失败 ⇒ **No-Go**。

---

## 在本 Agent 环境已执行且通过（不依赖 PostgreSQL）

| 检查 | 结果 | 说明 |
|------|------|------|
| `npm run typecheck` | **PASS** | 2026-03-23 |
| `npm run lint` | **PASS** | 同上 |
| Admin `location` 修复 | **已合入** | `src/app/admin/layout.tsx`：`router.replace` 仅在 `useEffect` 中、且仅当 `status === "unauthenticated"`；`status === "loading"` 时展示 `t("admin.sessionLoading")`（`src/lib/translations.ts` en/zh/es） |

**说明**：执行环境 **无 Docker / 无本机 PostgreSQL**（`127.0.0.1:5432` 未监听），故无法在 Agent 侧生成 migrate / seed / build / Stripe / 订单截图证据。

---

## 待 Staging / 负责人在本机（有 DB）补齐 — 请粘贴输出

### 1) Staging `DATABASE_URL` 与构建机可连库

- [ ] 平台已配置 `DATABASE_URL=postgresql://...`（staging 专用库）  
- **证据**：（粘贴）环境变量截图说明 或 构建日志片段 _____________________

### 2) `prisma migrate deploy` + `prisma db seed`

```text
（粘贴终端输出）
```

### 3) Admin layout（与 1 同源 build 验证）

- [ ] `npm run build` 无 `location is not defined`  
- **证据**：见第 4 节 build 日志

### 4) `npm run build` 成功

```text
（粘贴自 “next build” 至结束，含成功标记）
```

**本地推荐**：`docker compose up -d` → 设置 `DATABASE_URL=postgresql://printfig:devlocal@127.0.0.1:5432/printfig` → `npm run p0:verify`

### 5) Stripe Webhook 实投 — Event ID

- **Event ID**：`evt_____________________`  
- **HTTP 状态**：_______  
- **证据**：Dashboard 投递截图或 CLI 输出（可脱敏）

### 6) 一单订单状态流转

- **订单 ID / 参考号**：_______________________  
- **状态变化**：_______________________ → _______________________  
- **证据**：截图路径或日志片段 _____________________

---

## 裁决（由 PM 填写）

- [ ] **Go** — 6 项证据齐全  
- [ ] **No-Go** — 缺口项：_______________________
