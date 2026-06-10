import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateWord } from "@/lib/docgen/word";
import { generatePDF } from "@/lib/docgen/pdf";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const { documentId, format } = (await req.json()) as {
    documentId: string;
    format: "docx" | "pdf";
  };

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!doc) return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  if (doc.userId !== session.user.id) {
    return NextResponse.json({ error: "無權限" }, { status: 403 });
  }

  // AuditLog
  await prisma.auditLog.create({
    data: {
      userId:  session.user.id,
      action:  "DOWNLOAD",
      docType: doc.docType,
      engine:  "n/a",
    },
  });

  const safeTitle = doc.title.replace(/[^\w一-鿿\s-]/g, "").slice(0, 50);

  if (format === "docx") {
    const buffer = await generateWord(doc.title, doc.docType, doc.content);
    return new Response(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type":        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(safeTitle)}.docx`,
      },
    });
  }

  if (format === "pdf") {
    const buffer = await generatePDF(doc.title, doc.docType, doc.content);
    return new Response(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(safeTitle)}.pdf`,
      },
    });
  }

  return NextResponse.json({ error: "不支援的格式" }, { status: 400 });
}
