# 錯誤記錄 — 防止重複

| 日期 | 問題 | 解決方法 |
|------|------|---------|
| Phase 1 | Prisma v7 改變 `datasource` 配置格式，`url = env(...)` 唔再有效 | 降回 Prisma v5（`prisma@5 @prisma/client@5`） |
| Phase 1 | `Buffer` 唔直接相容 `BodyInit`（Node 22 類型收窄）| 用 `as unknown as BodyInit` cast |
| Phase 1 | Next.js App Router 用 `<link>` 引入 Google Fonts 會觸發 `no-page-custom-font` 警告 | 改用 `next/font/google` |
| Phase 1 | `create-next-app` 唔能夠直接 scaffold 至已有檔案的目錄 | 先 scaffold 到 `/tmp`，再 `cp -r` 入目標目錄 |
