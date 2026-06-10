import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import WorkspaceClient from "./workspace-client";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <WorkspaceClient />;
}
