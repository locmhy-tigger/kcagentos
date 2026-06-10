# Phase 1 任務清單 — 核心 MVP

> 驗收標準：登入 → 講「幫我出 F.3 數學測驗」→ 60 秒內收到可下載 Word/PDF，任務記錄出現

---

## 0. 專案腳手架

- [ ] `0.1` 初始化 Next.js 14 (App Router) + TypeScript 專案
- [ ] `0.2` 安裝及配置 Tailwind CSS v4（`@tailwindcss/vite` 或 PostCSS）
- [ ] `0.3` 建立 `src/styles/tokens.css`，寫入 PRD §2.1 全部 CSS variables
- [ ] `0.4` 配置 Google Fonts：Noto Serif TC、Noto Sans TC、DM Sans、DM Mono
- [ ] `0.5` 建立 `.env.example`（`ANTHROPIC_API_KEY` / `DATABASE_URL` / `NEXTAUTH_*` / `PUSHER_*` / `GOOGLE_CLIENT_*` / `N8N_WEBHOOK_SECRET`）
- [ ] `0.6` 初始化 Prisma + `prisma/schema.prisma`（照 PRD §5 完整 schema：User / Task / Document / Timetable / Template / AuditLog / SubstitutionRequest + 所有 enum）

---

## 1. 認證：Google SSO + 用戶自動建檔

- [ ] `1.1` 安裝 NextAuth.js，配置 Google Provider，設 `hd` 參數限校內 domain
- [ ] `1.2` `signIn` callback 雙重驗證 email domain，非校內直接拒絕並跳錯誤頁
- [ ] `1.3` `signIn` callback 首次登入自動建 `User`（role=TEACHER），更新 `lastLoginAt`
- [ ] `1.4` JWT strategy，8 小時過期；session 帶 `userId`、`role`、`department`
- [ ] `1.5` 建立 `src/lib/auth.ts`：`requireRole(...roles)` middleware，供 API routes 及 pages 使用
- [ ] `1.6` 登入頁 `app/(auth)/login/page.tsx`：「智」印章 logo + 「以學校 Google 帳號登入」按鈕，套設計系統
- [ ] `1.7` 未登入自動導向 `/login`，已登入導向 `/`

### 1a. 用戶管理面板（ADMIN only）

- [ ] `1a.1` `app/admin/users/page.tsx`：用戶清單表格（姓名 / email / 角色 / 科組 / 最後登入）
- [ ] `1a.2` `GET /api/admin/users`：分頁查詢，`requireRole('ADMIN')`
- [ ] `1a.3` `PATCH /api/admin/users/:id`：更新 `role` / `department` / `isActive`，`requireRole('ADMIN')`；角色變更寫 AuditLog
- [ ] `1a.4` 前端：角色下拉選單、科組輸入、停用/啟用 toggle，樂觀更新 UI

---

## 2. Agent 系統提示

- [ ] `2.1` 建立 `prompts/agents/a01-dispatcher.md`：意圖分析、路由協議（`[ROUTE:x]` / `[DOCREADY]` / `[NEED_TOOL:x]`）、廣東話書面語規則
- [ ] `2.2` 建立 `prompts/agents/a02-ada.md`：課程顧問 charter（課程設計 / 學習計劃）
- [ ] `2.3` 建立 `prompts/agents/a03-ethan.md`：試卷設計師 charter（試題 / 評分準則）
- [ ] `2.4` 建立 `prompts/agents/a04-carla.md`：內容製作師 charter（工作紙 / 筆記 / 教材）
- [ ] `2.5` 建立 `prompts/agents/a05-andy.md`：校務行政 charter（代課 / 夾空堂 / 通告）
- [ ] `2.6` 建立 `prompts/agents/a06-donna.md`：數據分析師 charter（成績分析，提示本地 LLM）

---

## 3. 對話介面（UI 組件）

- [ ] `3.1` `src/components/Header.tsx`：「智」字珊瑚紅印章 logo + 學校名 + Agent 狀態 pills（A01-A06，idle/running/done 三態色）+ 引擎標籤
- [ ] `3.2` `src/components/SkillRail.tsx`：左側欄 — 18 個功能卡（見 §3.4）+ 最近 6 條任務進度
- [ ] `3.3` `src/components/ChatPanel.tsx`：對話泡（用家右 / Agent 左）、`[DOCREADY]` 觸發顯示 DocCard、偏移陰影設計、巨型「基智」水印空狀態
- [ ] `3.4` `src/components/DocCard.tsx`：文件卡，右上「基智 · KCSS」印章，「下載 Word」/ 「下載 PDF」/ 「WhatsApp 推送」按鈕
- [ ] `3.5` 主頁面 `app/page.tsx`：三欄 layout（Header / SkillRail / ChatPanel），響應式（手機收起左欄）
- [ ] `3.6` 快捷 chips：輸入框上方常用指令（「出試卷」/「代課安排」/「夾空堂」等）

### 18 個功能卡清單

**時間表 / 代課（4）**
- 代課安排通告
- 夾空堂（多人共同空檔）
- 找空堂老師
- 代課記錄查詢

**校務行政（5）**
- 家長通告
- 學生外出許可
- 採購申請
- 活動報名表
- 會議記錄

**教學 / 試卷（5）**
- 出試卷（Ethan）
- 出工作紙（Carla）
- 課程單元計劃（Ada）
- 學生筆記（Carla）
- 成績分析（Donna）

**其他（4）**
- 自訂（自由對話）
- 科組通告
- 學習計劃
- 活動計劃

---

## 4. `/api/chat` — Dispatcher 路由

- [ ] `4.1` 建立 `src/lib/llm.ts`：統一 LLM 介面，支援 Claude (`claude-sonnet-4-5`) / Ollama / LM Studio，讀環境變數切換
- [ ] `4.2` 建立 `src/lib/agents.ts`：載入 `prompts/agents/*.md`，路由解析（`[ROUTE:x]`），charter map
- [ ] `4.3` `POST /api/chat`：兩段式呼叫 — 先 A01 分析意圖取得 `[ROUTE:agentKey]`，再叫對應 Agent 生成，SSE stream 回傳 `{agentId, text, route, docReady}`
- [ ] `4.4` Pusher 廣播：Agent 開始/完成時 push `{agentId, status}` 到前端，pills 實時更新
- [ ] `4.5` `[DOCREADY]` 偵測：訊息含標記時自動建立 `Task` + `Document` 記錄，回傳 `documentId`
- [ ] `4.6` 每次呼叫寫 `AuditLog`（action=GENERATE，engine，agentId）

---

## 5. 服務端文件生成 `/api/doc`

- [ ] `5.1` 安裝 `docx` npm package
- [ ] `5.2` 安裝 `@react-pdf/renderer`
- [ ] `5.3` 下載/嵌入中文字體：標楷體（`TW-Kai`）或 Noto Serif TC，供 docx + PDF 使用
- [ ] `5.4` 建立 `src/lib/docgen/word.ts`：`Document.content`（Markdown）→ `docx` Word 文件，含學校抬頭、中文字體、主藍分隔線
- [ ] `5.5` 建立 `src/lib/docgen/pdf.ts`：同一內容 → `@react-pdf/renderer` PDF，含「基智 · KCSS」印章、主藍色頁眉/分隔線、學校 logo 佔位
- [ ] `5.6` `POST /api/doc`：`{ documentId, format: 'docx'|'pdf' }` → 回傳對應 file stream，`Content-Disposition: attachment`

---

## 6. 任務進度

- [ ] `6.1` `GET /api/tasks`：回傳當前用戶最近 6 條 `Task`（含 status / agentId / title / createdAt）
- [ ] `6.2` `SkillRail.tsx` 底部任務清單：輪詢或 Pusher 更新，RUNNING 顯示琥珀色進度點，DONE 顯示綠色，FAILED 顯示紅色
- [ ] `6.3` 點擊任務項目可跳返對應對話串

---

## 7. 收尾與驗收

- [ ] `7.1` 建立 `tasks/lessons.md`（錯誤記錄檔，初始為空）
- [ ] `7.2` 設定 Zeabur 環境變數清單（文件化，唔入 repo）
- [ ] `7.3` 端到端測試：登入 → 輸入「幫我出 F.3 數學測驗」→ 確認 Agent pills 動畫 → 收到 DocCard → 下載 Word → 下載 PDF → 任務記錄出現
- [ ] `7.4` 確認 AuditLog 有寫入記錄
- [ ] `7.5` 確認非校內 email 被拒於 login 頁

---

## 依賴安裝總覽

```bash
# 核心框架
next@14  react  react-dom  typescript
tailwindcss@4  postcss  autoprefixer

# 認證
next-auth

# 數據庫
prisma  @prisma/client

# 即時通訊
pusher  pusher-js

# AI
@anthropic-ai/sdk

# 文件生成
docx  @react-pdf/renderer

# 工具
zod  # 輸入驗證
```

---

_最後更新：Phase 1 開工前確認_
