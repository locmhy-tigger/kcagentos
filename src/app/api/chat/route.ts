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
} from "@/lib/agents";
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

  const { messages, engine = "claude" } = (await req.json()) as {
    messages: LLMMessage[];
    engine?: Engine;
  };

  // 基本環境變數檢查
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "伺服器未設定 ANTHROPIC_API_KEY，請聯絡 IT 主任。" },
      { status: 503 },
    );
  }

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

      try {
        // ── Stage 1: Dispatcher (A01) ──────────────────────────────────
        await pushEvent(channelName, "agent-status", { agentId: "A01", status: "running" });
        send({ agentId: "A01", status: "running" });

        const dispatcherSystem = loadCharter("dispatcher");
        const dispatcherReply  = await completeLLM(engine, messages, {
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
        await pushEvent(channelName, "agent-status", { agentId: specAgentId, status: "running" });
        send({ agentId: specAgentId, status: "running", route: routeKey });

        const specialistSystem = loadCharter(routeKey);
        let fullText = "";

        for await (const chunk of streamLLM(engine, messages, {
          system:    specialistSystem,
          maxTokens: 4096,
        })) {
          fullText += chunk;
          send({ agentId: specAgentId, text: chunk, chunk: true });
        }

        await pushEvent(channelName, "agent-status", { agentId: specAgentId, status: "done" });

        const docReady      = parseDocReady(fullText);
        const docType       = parseDocType(fullText);
        const needsApproval = parseNeedsApproval(fullText);
        const docTitleTag   = parseDocTitle(fullText);

        const cleanContent = fullText
          .replace(/\[DOCREADY\]/g, "")
          .replace(/\[DOCTYPE:[^\]]+\]/g, "")
          .replace(/\[TITLE:[^\]]+\]/g, "")
          .replace(/\[NEEDS_APPROVAL\]/g, "")
          .trim();

        // 檔案名稱：優先用 [TITLE:xxx]，其次從內容首行提取
        const docTitle = docTitleTag ?? inferTitleFromContent(docType, cleanContent);

        let documentId: string | null = null;

        if (docReady) {
          try {
            const task = await prisma.task.create({
              data: {
                userId,
                title:   docTitle,
                agentId: specAgentId,
                status:  needsApproval ? "PENDING_APPROVAL" : "DONE",
              },
            });
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
