import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import QuotationClient from "./quotation-client";

export const metadata = { title: "口頭報價採購表 — 基智 Agent OS" };

export default async function QuotationPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <QuotationClient />;
}
