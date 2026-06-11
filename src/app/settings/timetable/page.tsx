import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import TimetableClient from "./timetable-client";

export const metadata = { title: "時間表上載 — 基智 Agent OS" };

export default async function TimetablePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");
  return <TimetableClient />;
}
