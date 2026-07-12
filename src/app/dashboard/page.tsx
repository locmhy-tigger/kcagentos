import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import DashboardClient from "./dashboard-client";

export const metadata = { title: "指揮中心 — 基智 Agent OS" };

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return (
    <DashboardClient
      userName={session.user.name ?? "老師"}
      role={session.user.role}
    />
  );
}
