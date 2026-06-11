import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// One-time admin bootstrap — only works when SETUP_TOKEN env var is set.
// Usage:  POST /api/admin/bootstrap
//         Authorization: Bearer <SETUP_TOKEN>
//         { "email": "cmlo@gs.keichi.edu.hk" }
// Remove / unset SETUP_TOKEN after first use.
export async function POST(req: NextRequest) {
  const token = process.env.SETUP_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Bootstrap disabled (SETUP_TOKEN not set)" }, { status: 403 });
  }

  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${token}`) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { email } = await req.json().catch(() => ({}));
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Provide { email }" }, { status: 400 });
  }

  const user = await prisma.user.upsert({
    where:  { email },
    update: { role: "ADMIN" },
    create: { email, name: email.split("@")[0], role: "ADMIN" },
  });

  return NextResponse.json({ ok: true, id: user.id, email: user.email, role: user.role });
}
