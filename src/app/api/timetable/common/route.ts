import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getAllTeachers,
  getCommonFreeSlots,
  getLatestTerm,
  matchTeacher,
} from "@/lib/timetable";

// GET /api/timetable/common?teachers=陳大文,李小明&term=2025-26
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const teachersParam = req.nextUrl.searchParams.get("teachers") ?? "";
  const queries = teachersParam.split(",").map((t) => t.trim()).filter(Boolean);
  if (queries.length === 0) {
    return NextResponse.json({ error: "請提供老師名單（teachers=a,b,c）" }, { status: 400 });
  }

  const term = req.nextUrl.searchParams.get("term") ?? (await getLatestTerm());
  if (!term) return NextResponse.json({ error: "尚未上載任何時間表" }, { status: 404 });

  const allTeachers = await getAllTeachers(term);
  const matches = queries.map((q) => matchTeacher(q, allTeachers));

  const notFound  = matches.filter((m) => m.notFound).map((m) => m.query);
  const ambiguous = matches.filter((m) => m.candidates);
  if (notFound.length > 0 || ambiguous.length > 0) {
    return NextResponse.json(
      {
        error: "部分老師無法匹配",
        notFound,
        ambiguous: ambiguous.map((m) => ({ query: m.query, candidates: m.candidates })),
      },
      { status: 422 },
    );
  }

  const resolved = matches.map((m) => m.matched!);
  const slots = await getCommonFreeSlots(resolved, term);

  return NextResponse.json({ term, teachers: resolved, slots });
}
