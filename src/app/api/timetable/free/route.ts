import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getFreeTeachers, getLatestTerm, MAX_DAY, MAX_PERIOD } from "@/lib/timetable";

// GET /api/timetable/free?day=3&period=5&term=2025-26
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const day    = parseInt(req.nextUrl.searchParams.get("day") ?? "", 10);
  const period = parseInt(req.nextUrl.searchParams.get("period") ?? "", 10);

  if (!Number.isInteger(day) || day < 1 || day > MAX_DAY) {
    return NextResponse.json({ error: `day 必須為 1-${MAX_DAY}` }, { status: 400 });
  }
  if (!Number.isInteger(period) || period < 1 || period > MAX_PERIOD) {
    return NextResponse.json({ error: `period 必須為 1-${MAX_PERIOD}` }, { status: 400 });
  }

  const term = req.nextUrl.searchParams.get("term") ?? (await getLatestTerm());
  if (!term) return NextResponse.json({ error: "尚未上載任何時間表" }, { status: 404 });

  const teachers = await getFreeTeachers(day, period, term);
  return NextResponse.json({ term, day, period, teachers });
}
