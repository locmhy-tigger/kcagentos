import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import TemplatesClient from "./templates-client";

export const metadata = { title: "範本庫 — 基智 Agent OS" };

export default async function TemplatesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <TemplatesClient />;
}
