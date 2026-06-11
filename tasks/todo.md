# 任務清單

## Phase 1 — 核心 MVP ✅ 已完成

> 驗收標準：登入 → 講「幫我出 F.3 數學測驗」→ 60 秒內收到可下載 Word/PDF，任務記錄出現

- [x] 節 0：專案腳手架（Next.js 14、Tailwind、Prisma schema、CSS tokens、.env.example）
- [x] 節 1：Google SSO（domain 限定 gs.keichi.edu.hk、JWT 8h、requireRole middleware、登入頁）
- [x] 節 1a：用戶管理面板 `/admin/users`（ADMIN only、角色指派、停用/啟用）
- [x] 節 2：6 個 Agent system prompts（A01 Dispatcher → A06 Donna）
- [x] 節 3：對話介面（Header pills、SkillRail 18 功能卡、ChatPanel SSE、DocCard）
- [x] 節 4：`/api/chat` 兩段式路由、Pusher 廣播（可選）、AuditLog
- [x] 節 5：`/api/doc` Word（純內容）+ PDF（Noto Sans TC 嵌入，無亂碼）
- [x] 節 6：`/api/tasks` 最近 6 條任務、SkillRail 輪詢更新
- [x] 修復：error=Callback（移除 PrismaAdapter）、空白回應（錯誤處理）、PDF 亂碼（字體嵌入）

---

## Phase 2 — 真實自動化 ✅ 已完成（待部署驗收）

> 驗收標準：上載時間表 CSV →「IT 組 5 人夾空堂」回傳真實共同時段；代課 WhatsApp 發出且回覆可更新狀態

### 1. 時間表上載

- [x] `1.1` `/settings/timetable` 頁面（ADMIN only）：上載 CSV/Excel 介面，套設計系統
- [x] `1.2` `POST /api/timetable/upload`：multipart 接收 CSV，格式「老師,星期,節次,班別,科目」
- [x] `1.3` CSV 解析器：驗證欄位（星期 1-5、節次 1-9）、錯誤行報告 `{ parsed: n, errors: [] }`
- [x] `1.4` 寫入 `Timetable` 表（upsert，依 `teacherName+dayOfWeek+period+term` unique key）
- [x] `1.5` 學期（term）選擇器，支援覆蓋重新上載
- [x] `1.6` 上載成功後顯示統計摘要（幾多位老師、幾多筆記錄）

### 2. 夾空堂引擎

- [x] `2.1` `src/lib/timetable.ts`：空堂計算核心 — `getCommonFreeSlots(teachers[], term)` 回傳共同空堂時段
- [x] `2.2` `GET /api/timetable/common?teachers=a,b,c` → `{ slots: [{day, period}] }`
- [x] `2.3` `timetable_query` 工具整合：A05 Andy 收到夾空堂請求 → `[NEED_TOOL:timetable_query]` → API 調用真實計算 → 結果回饋俾 Agent 生成回覆
- [x] `2.4` 老師名單模糊匹配（輸入「陳sir」可對應「陳大文」）+ 找唔到老師時的友好錯誤提示
- [x] `2.5` 結果以表格形式顯示喺對話中（星期 × 節次 grid）

### 3. 找空堂老師

- [x] `3.1` `GET /api/timetable/free?day=3&period=5` → `{ teachers: [] }`
- [x] `3.2` A05 整合：「星期三第五節邊個有空？」→ 回傳該節空堂老師名單
- [x] `3.3` 配合代課流程：請假日期+節次 → 自動列出候選代課老師

### 4. WhatsApp 推送

- [x] `4.1` `src/lib/notify.ts`：n8n webhook client，payload `{title, content, recipients[], requestId}`
- [x] `4.2` `POST /api/notify`：驗證 session → 轉發 n8n webhook → 寫 AuditLog（action=PUSH_WA）
- [x] `4.3` DocCard 加「WhatsApp 推送」按鈕 + 收件人選擇 UI
- [x] `4.4` `SubstitutionRequest` 建立流程：代課確認時建立記錄（waStatus=SENT）

### 5. WhatsApp 雙向回覆

- [x] `5.1` `POST /api/notify/callback`：n8n 回調端點，shared secret header 驗證（`N8N_WEBHOOK_SECRET`）
- [x] `5.2` 回調更新 `SubstitutionRequest.waStatus`（CONFIRMED / DECLINED）
- [x] `5.3` Pusher 通知前端「✓ 陳老師已確認」（toast 或對話內系統訊息）

### 6. 本地 LLM 切換

- [x] `6.1` `SettingsModal.tsx`：引擎設定面板（Claude / Ollama / LM Studio + URL + model 名）
- [x] `6.2` 引擎選擇持久化（localStorage 或 User 表），`/api/chat` 接收 engine 參數（已有基礎）
- [x] `6.3` Header 引擎標籤：本地引擎時轉琥珀色「本地」（已有基礎，接通設定）
- [x] `6.4` A06 Donna 強制提示：成績分析時 UI 顯著提示「建議切換本地引擎」
- [x] `6.5` 雲端模式下學生姓名以學號代替送入 LLM（匿名化處理）

### 7. 收尾與驗收（邏輯已單元測試通過；端到端需部署後真實數據驗收）

- [ ] `7.1` 端到端測試：上載 CSV →「IT 組 5 人夾空堂」→ 回傳真實共同時段
- [ ] `7.2` 測試：「星期三第五節邊個有空」→ 正確名單
- [ ] `7.3` 測試：代課 WhatsApp 發出 → n8n 回調 → 狀態更新 → 前端通知
- [ ] `7.4` 測試：切換 Ollama 引擎 → 對話正常 → header 顯示「本地」
- [x] `7.5` 更新 `tasks/lessons.md`

### 0. 範本庫（提早至 Phase 2）✅ 已完成

- [x] `0.1` `/settings/templates` 管理頁（CRUD、isDefault 開關、所有登入用戶可用）
- [x] `0.2` `GET/POST /api/templates` + `GET/PATCH/DELETE /api/templates/[id]`
- [x] `0.3` Agent 生成前自動查找預設範本，注入 Specialist 系統提示（`AGENT_DOC_TYPES` 映射）
- [x] `0.4` Header 用戶選單 + SkillRail 加入「範本庫」快速連結

---

_最後更新：Phase 2 實施完成（2026-06-11）_
