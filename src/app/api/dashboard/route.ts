import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/dashboard?scope=mine|all
// 回傳指揮中心一頁所需：全校 vitals（過去 7 日）+ 任務板 + 個人待辦
// scope=all 只限 ADMIN / APPROVER（其他角色靜默回退 mine）
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const userId = session.user.id;
  const role   = session.user.role;
  const wantAll = req.nextUrl.searchParams.get("scope") === "all";
  const scopeAll = wantAll && (role === "ADMIN" || role === "APPROVER");

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [weekTasks, weekDocs, pendingApprovals, weekSubs, tasks, todos] = await Promise.all([
    prisma.task.count({ where: { createdAt: { gte: since } } }),
    prisma.document.count({ where: { createdAt: { gte: since } } }),
    prisma.document.count({ where: { approvalStatus: "PENDING" } }),
    prisma.substitutionRequest.count({ where: { createdAt: { gte: since } } }),
    prisma.task.findMany({
      where:   scopeAll ? {} : { userId },
      orderBy: { createdAt: "desc" },
      take:    60,
      include: {
        document: { select: { id: true, docType: true } },
        user:     { select: { name: true } },
      },
    }),
    prisma.todo.findMany({
      where:   { userId },
      orderBy: [{ done: "asc" }, { createdAt: "desc" }],
      take:    50,
    }),
  ]);

  return NextResponse.json({
    scope:  scopeAll ? "all" : "mine",
    vitals: { weekTasks, weekDocs, pendingApprovals, weekSubs },
    tasks,
    todos,
  });
}
