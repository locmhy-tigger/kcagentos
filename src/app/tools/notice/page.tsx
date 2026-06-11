import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import NoticeClient from "./notice-client";

export const metadata = { title: "活動通告生成 — 基智 Agent OS" };

export default async function NoticePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <NoticeClient />;
}
