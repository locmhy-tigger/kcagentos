import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ApprovalsClient from "./approvals-client";

export const metadata = { title: "待批核文件 — 基智 Agent OS" };

export default async function ApprovalsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "APPROVER") redirect("/");
  return <ApprovalsClient />;
}
