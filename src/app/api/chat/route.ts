import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { streamLLM, completeLLM, type Engine, type LLMMessage } from "@/lib/llm";
import {
  loadCharter,
  parseRoute,
  parseDocReady,
  parseDocType,
  parseNeedsApproval,
  parseDocTitle,
  agentId,
  inferTitleFromContent,
  parseNeedTool,
  stripToolMarkers,
  AGENT_DOC_TYPES,
  type AgentKey,
} from "@/lib/agents";
import { runAgentTool } from "@/lib/agent-tools";
import { prisma } from "@/lib/prisma";
import Pusher from "pusher";

// Pusher 可選 — 未設環境變數時靜默忽略
const pusher =
  process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET
    ? new Pusher({
        appId:   process.env.PUSHER_APP_ID,
        key:     process.env.PUSHER_KEY,
        secret:  process.env.PUSHER_SECRET,
        cluster: process.env.PUSHER_CLUSTER ?? "ap1",
        useTLS:  true,
      })
    : null;

async function pushEvent(channel: string, event: string, data: object) {
  try {
    if (pusher) await pusher.trigger(channel, event, data);
  } catch {}
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const { messages, engine = "claude", engineConfig = {} } = (await req.json()) as {
    messages: LLMMessage[];
    engine?: Engine;
    engineConfig?: { baseUrl?: string; model?: string };
  };

  // Claude 引擎需要 API key；本地引擎唔需要
  if (engine === "claude" && !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "伺服器未設定 ANTHROPIC_API_KEY，請聯絡 IT 主任，或喺設定切換本地引擎。" },
      { status: 503 },
    );
  }

  const llmOpts = {
    baseUrl: engineConfig.baseUrl  || undefined,
    model:   engineConfig.model    || undefined,
  };

  const userId      = session.user.id;
  const channelName = `user-${userId}`;
  const encoder     = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {}
      };

      // 專員開工時即建 RUNNING 任務，dashboard 進度板先見到「處理中」
      let runningTaskId: string | null = null;

      try {
        // ── Stage 1: Dispatcher (A01) ──────────────────────────────────
        await pushEvent(channelName, "agent-status", { agentId: "A01", status: "running" });
        send({ agentId: "A01", status: "running" });

        const dispatcherSystem = loadCharter("dispatcher");
        const dispatcherReply  = await completeLLM(engine, messages, {
          ...llmOpts,
          system:    dispatcherSystem,
          maxTokens: 512,
        });

        await pushEvent(channelName, "agent-status", { agentId: "A01", status: "done" });

        const routeKey = parseRoute(dispatcherReply);

        // Dispatcher 問清楚階段 → 直接回傳純文字
        if (!routeKey) {
          const cleanReply = dispatcherReply
            .replace(/\[ROUTE:\w+\]/g, "")
            .replace(/\[NEED_TOOL:\w+\]/g, "")
            .trim();
          // chunk:true 確保 ChatPanel 用 accumulated 路徑處理
          send({ agentId: "A01", text: cleanReply, chunk: true });
          send({ agentId: "A01", status: "done", final: true });
          controller.close();
          return;
        }

        // ── Stage 2: Specialist Agent ───────────────────────────────────
        const specAgentId = agentId(routeKey);
        // A06 成績分析 + 雲端引擎 → 提示建議切換本地引擎
        const privacyHint = routeKey === "donna" && engine === "claude";
        await pushEvent(channelName, "agent-status", { agentId: specAgentId, status: "running" });
        send({ agentId: specAgentId, status: "running", route: routeKey, privacyHint });

        // 即時建立 RUNNING 任務（完成後更新；純對話回合會刪走）
        try {
          const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
          const runningTask = await prisma.task.create({
            data: {
              userId,
              title:   lastUserMsg.trim().slice(0, 50) || "新任務",
              agentId: specAgentId,
              status:  "RUNNING",
            },
          });
          runningTaskId = runningTask.id;
          await pushEvent(channelName, "task-update", {
            taskId:  runningTask.id,
            status:  "RUNNING",
            agentId: specAgentId,
            title:   runningTask.title,
          });
        } catch (dbErr) {
          console.error("[api/chat] create running task:", dbErr);
        }

        // Inject any default templates for this agent's docTypes
        let specialistSystem = loadCharter(routeKey);
        try {
          const relevantTypes = AGENT_DOC_TYPES[routeKey as AgentKey] ?? [];
          if (relevantTypes.length > 0) {
            const defaultTemplates = await prisma.template.findMany({
              where: { docType: { in: relevantTypes }, isDefault: true },
            });
            if (defaultTemplates.length > 0) {
              const sections = defaultTemplates.map((t) =>
                `【${t.name}】（類型：${t.docType}）\n${t.content}`
              ).join("\n\n---\n\n");
              specialistSystem += `\n\n---\n[範本庫]\n以下是管理員設定的預設範本，請參考其格式和結構生成文件。使用 {{}} 佔位符標示的位置請根據對話內容填充實際資訊。\n\n${sections}`;
            }
          }
        } catch {
          // 範本查詢失敗不影響正常生成
        }

        // 雲端模式下成績數據匿名化：學生姓名以學號代替
        if (privacyHint) {
          specialistSystem += "\n\n---\n[私隱保護]\n現時使用雲端引擎。分析及輸出時，學生一律以班別+學號表示（如 3A-12），不得在輸出中複述學生全名。並在回覆開頭提醒用戶：處理敏感成績數據建議切換本地引擎（設定 → 引擎）。";
        }
        let fullText = "";
        let workingMessages = [...messages];

        for await (const chunk of streamLLM(engine, workingMessages, {
          ...llmOpts,
          system:    specialistSystem,
          maxTokens: 4096,
        })) {
          fullText += chunk;
          send({ agentId: specAgentId, text: chunk, chunk: true });
        }

        // ── 工具調用迴圈：[NEED_TOOL:x]{params} → 執行 → 結果回饋再生成 ──
        let toolCall  = parseNeedTool(fullText);
        let toolRound = 0;
        while (toolCall && toolRound < 2) {
          toolRound++;
          send({ agentId: specAgentId, status: "running", tool: toolCall.tool });
          await pushEvent(channelName, "agent-status", {
            agentId: specAgentId, status: "running", tool: toolCall.tool,
          });

          const toolResult = await runAgentTool(toolCall, { userId });

          workingMessages = [
            ...workingMessages,
            { role: "assistant" as const, content: fullText },
            { role: "user" as const, content: `[系統：工具 ${toolCall.tool} 執行結果]\n${toolResult}\n\n請根據以上結果回覆用戶。` },
          ];

          fullText = "";
          send({ agentId: specAgentId, text: "\n\n", chunk: true });
          for await (const chunk of streamLLM(engine, workingMessages, {
            ...llmOpts,
            system:    specialistSystem,
            maxTokens: 4096,
          })) {
            fullText += chunk;
            send({ agentId: specAgentId, text: chunk, chunk: true });
          }
          toolCall = parseNeedTool(fullText);
        }

        await pushEvent(channelName, "agent-status", { agentId: specAgentId, status: "done" });

        const docReady      = parseDocReady(fullText);
        const docType       = parseDocType(fullText);
        const needsApproval = parseNeedsApproval(fullText);
        const docTitleTag   = parseDocTitle(fullText);

        const cleanContent = stripToolMarkers(
          fullText
            .replace(/\[DOCREADY\]/g, "")
            .replace(/\[DOCTYPE:[^\]]+\]/g, "")
            .replace(/\[TITLE:[^\]]+\]/g, "")
            .replace(/\[NEEDS_APPROVAL\]/g, ""),
        ).trim();

        // 檔案名稱：優先用 [TITLE:xxx]，其次從內容首行提取
        const docTitle = docTitleTag ?? inferTitleFromContent(docType, cleanContent);

        let documentId: string | null = null;

        if (docReady) {
          try {
            const taskData = {
              title:  docTitle,
              status: (needsApproval ? "PENDING_APPROVAL" : "DONE") as "PENDING_APPROVAL" | "DONE",
            };
            const task = runningTaskId
              ? await prisma.task.update({ where: { id: runningTaskId }, data: taskData })
              : await prisma.task.create({ data: { userId, agentId: specAgentId, ...taskData } });
            const doc = await prisma.document.create({
              data: {
                taskId:         task.id,
                userId,
                title:          docTitle,
                docType,
                content:        cleanContent,
                approvalStatus: needsApproval ? "PENDING" : "NOT_REQUIRED",
              },
            });
            documentId = doc.id;

            await prisma.auditLog.create({
              data: { userId, action: "GENERATE", agentId: specAgentId, engine, docType },
            });

            await pushEvent(channelName, "task-update", {
              taskId:  task.id,
              status:  task.status,
              agentId: specAgentId,
              title:   task.title,
            });
          } catch (dbErr) {
            console.error("[api/chat] DB error:", dbErr);
            // DB 錯誤唔阻止回傳文字內容，只係唔儲存
          }
        } else if (runningTaskId) {
          // 純對話回合（無生成文件）— 刪走臨時任務，免進度板積塵
          try {
            await prisma.task.delete({ where: { id: runningTaskId } });
          } catch {}
          runningTaskId = null;
        }

        send({
          agentId: specAgentId,
          status:  "done",
          docReady,
          documentId,
          docType,
          needsApproval,
          final:   true,
        });

        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[api/chat]", err);
        if (runningTaskId) {
          try {
            await prisma.task.update({ where: { id: runningTaskId }, data: { status: "FAILED" } });
          } catch {}
        }
        send({ error: `處理失敗：${msg.slice(0, 120)}` });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache",
      Connection:      "keep-alive",
    },
  });
}
