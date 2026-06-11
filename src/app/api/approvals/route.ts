import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/approvals?status=PENDING
// APPROVER / ADMIN: see pending documents across all users
// TEACHER: see own documents' approval status
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const role   = session.user.role;
  const status = req.nextUrl.searchParams.get("status") ?? "PENDING";

  const isApprover = role === "ADMIN" || role === "APPROVER";

  const docs = await prisma.document.findMany({
    where: {
      approvalStatus: status as never,
      ...(isApprover ? {} : { userId: session.user.id }),
    },
    include: {
      user: { select: { name: true, email: true, department: true } },
      task: { select: { agentId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(docs);
}
