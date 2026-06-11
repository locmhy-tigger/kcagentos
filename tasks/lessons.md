# 錯誤記錄 — 防止重複

| 日期 | 問題 | 解決方法 |
|------|------|---------|
| Phase 1 | Prisma v7 改變 `datasource` 配置格式，`url = env(...)` 唔再有效 | 降回 Prisma v5（`prisma@5 @prisma/client@5`） |
| Phase 1 | `Buffer` 唔直接相容 `BodyInit`（Node 22 類型收窄）| 用 `as unknown as BodyInit` cast |
| Phase 1 | Next.js App Router 用 `<link>` 引入 Google Fonts 會觸發 `no-page-custom-font` 警告 | 改用 `next/font/google` |
| Phase 1 | `create-next-app` 唔能夠直接 scaffold 至已有檔案的目錄 | 先 scaffold 到 `/tmp`，再 `cp -r` 入目標目錄 |

## Phase 2 教訓

- **archiver CJS 與 Next.js webpack 唔兼容**：`Module not found: Default condition should be last one`。`experimental.serverComponentsExternalPackages` 對 archiver 無效（webpack 仍嘗試以 ESM import），最終用 `config.externals.push("archiver")` + route 內 `require()` 解決。
- **@types/archiver 冇 default export**：TypeScript strict 下 `import archiver from "archiver"` 報錯，改用 `import type` + `require()` 取值。
- **tsx 測試腳本喺 /tmp 時 `@/` alias 唔生效**：要用絕對路徑 import，或日後加 vitest 配 tsconfig paths。
- **Agent 工具迴圈設計**：`[NEED_TOOL:x]{json}` 喺串流完成後先解析，將結果以 user message 回饋再串流第二輪（上限 2 輪），避免阻塞首輪輸出。
