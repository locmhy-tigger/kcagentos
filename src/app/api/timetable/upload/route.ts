import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseTimetableCsv } from "@/lib/timetable";

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN");
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }

  const formData = await req.formData();
  const file     = formData.get("file");
  const term     = String(formData.get("term") ?? "").trim();
  const replace  = formData.get("replace") === "true";

  if (!term) return NextResponse.json({ error: "請指定學期（term）" }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "請上載 CSV 檔案" }, { status: 400 });

  const text = await file.text();
  const { rows, errors } = parseTimetableCsv(text);

  if (rows.length === 0) {
    return NextResponse.json({ error: "檔案中無有效記錄", parsed: 0, errors }, { status: 400 });
  }

  // 覆蓋模式：先清除該學期所有記錄
  if (replace) {
    await prisma.timetable.deleteMany({ where: { term } });
  }

  let written = 0;
  for (const row of rows) {
    await prisma.timetable.upsert({
      where: {
        teacherName_dayOfWeek_period_term: {
          teacherName: row.teacherName,
          dayOfWeek:   row.dayOfWeek,
          period:      row.period,
          term,
        },
      },
      update: { classCode: row.classCode, subject: row.subject },
      create: { ...row, term },
    });
    written++;
  }

  const teachers = new Set(rows.map((r) => r.teacherName)).size;

  return NextResponse.json({ parsed: written, teachers, errors, term });
}
