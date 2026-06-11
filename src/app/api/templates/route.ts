import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const docType = req.nextUrl.searchParams.get("docType");
  const templates = await prisma.template.findMany({
    where: docType ? { docType } : undefined,
    orderBy: [{ docType: "asc" }, { isDefault: "desc" }, { name: "asc" }],
  });
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { docType, name, content, isDefault = false } = await req.json();
  if (!docType || !name || !content) {
    return NextResponse.json({ error: "缺少必要欄位（docType / name / content）" }, { status: 400 });
  }

  // 新設為 default 時，清除同 docType 的其他 default
  if (isDefault) {
    await prisma.template.updateMany({ where: { docType, isDefault: true }, data: { isDefault: false } });
  }

  const template = await prisma.template.create({ data: { docType, name, content, isDefault } });
  return NextResponse.json(template, { status: 201 });
}
