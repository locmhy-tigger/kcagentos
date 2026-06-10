import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { streamLLM, completeLLM, type Engine, type LLMMessage } from "@/lib/llm";
import {
  loadCharter,
  parseRoute,
  parseDocReady,
  parseDocType,
  parseNeedsApproval,
  agentId,
  inferTitleFromContent,
} from "@/lib/agents";
import { prisma } from "@/lib/prisma";
import Pusher from "pusher";

const pusher = new Pusher({
  appId:   process.env.PUSHER_APP_ID!,
  key:     process.env.PUSHER_KEY!,
  secret:  process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER ?? "ap1",
  useTLS:  true,
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const { messages, engine = "claude" } = (await req.json()) as {
    messages: LLMMessage[];
    engine?: Engine;
  };

  const userId = session.user.id;
  const channelName = `user-${userId}`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // ── Stage 1: Dispatcher (A01) ─────────────────────────────────────
        await pusher.trigger(channelName, "agent-status", { agentId: "A01", status: "running" });
        send({ agentId: "A01", status: "running" });

        const dispatcherSystem = loadCharter("dispatcher");
        const dispatcherReply = await completeLLM(engine, messages, {
          system: dispatcherSystem,
          maxTokens: 512,
        });

        await pusher.trigger(channelName, "agent-status", { agentId: "A01", status: "done" });
        send({ agentId: "A01", status: "done", text: dispatcherReply });

        const routeKey = parseRoute(dispatcherReply);

        // Dispatcher回覆唔含路由 → 直接回傳（問清楚階段）
        if (!routeKey) {
          const cleanReply = dispatcherReply
            .replace(/\[ROUTE:\w+\]/g, "")
            .replace(/\[NEED_TOOL:\w+\]/g, "")
            .trim();
          send({ agentId: "A01", text: cleanReply, final: true });
          controller.close();
          return;
        }

        // ── Stage 2: Specialist Agent ─────────────────────────────────────
        const specAgentId = agentId(routeKey);
        await pusher.trigger(channelName, "agent-status", { agentId: specAgentId, status: "running" });
        send({ agentId: specAgentId, status: "running", route: routeKey });

        const specialistSystem = loadCharter(routeKey);
        let fullText = "";

        for await (const chunk of streamLLM(engine, messages, {
          system: specialistSystem,
          maxTokens: 4096,
        })) {
          fullText += chunk;
          send({ agentId: specAgentId, text: chunk, chunk: true });
        }

        await pusher.trigger(channelName, "agent-status", { agentId: specAgentId, status: "done" });

        const docReady = parseDocReady(fullText);
        const docType = parseDocType(fullText);
        const needsApproval = parseNeedsApproval(fullText);

        // 清理標記
        const cleanContent = fullText
          .replace(/\[DOCREADY\]/g, "")
          .replace(/\[DOCTYPE:[^\]]+\]/g, "")
          .replace(/\[NEEDS_APPROVAL\]/g, "")
          .trim();

        let documentId: string | null = null;

        if (docReady) {
          // 建立 Task + Document
          const task = await prisma.task.create({
            data: {
              userId,
              title: `${docType} · ${specAgentId}`,
              agentId: specAgentId,
              status: needsApproval ? "PENDING_APPROVAL" : "DONE",
            },
          });

          const doc = await prisma.document.create({
            data: {
              taskId:        task.id,
              userId,
              title:         inferTitleFromContent(docType, cleanContent),
              docType,
              content:       cleanContent,
              approvalStatus: needsApproval ? "PENDING" : "NOT_REQUIRED",
            },
          });

          // Update task status
          await prisma.task.update({
            where: { id: task.id },
            data: { status: needsApproval ? "PENDING_APPROVAL" : "DONE" },
          });

          documentId = doc.id;

          // AuditLog
          await prisma.auditLog.create({
            data: {
              userId,
              action:  "GENERATE",
              agentId: specAgentId,
              engine,
              docType,
            },
          });

          await pusher.trigger(channelName, "task-update", {
            taskId: task.id,
            status: task.status,
            agentId: specAgentId,
            title: task.title,
          });
        }

        send({
          agentId:    specAgentId,
          status:     "done",
          docReady,
          documentId,
          docType,
          needsApproval,
          final: true,
        });

        controller.close();
      } catch (err) {
        console.error("[api/chat]", err);
        send({ error: "處理失敗，請再試。" });
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
