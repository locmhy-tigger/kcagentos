import fs from "fs";
import path from "path";

export type AgentKey = "dispatcher" | "ada" | "ethan" | "carla" | "andy" | "donna";

const AGENT_FILES: Record<AgentKey, string> = {
  dispatcher: "a01-dispatcher.md",
  ada:        "a02-ada.md",
  ethan:      "a03-ethan.md",
  carla:      "a04-carla.md",
  andy:       "a05-andy.md",
  donna:      "a06-donna.md",
};

const AGENT_IDS: Record<AgentKey, string> = {
  dispatcher: "A01",
  ada:        "A02",
  ethan:      "A03",
  carla:      "A04",
  andy:       "A05",
  donna:      "A06",
};

const charterCache = new Map<AgentKey, string>();

export function loadCharter(agent: AgentKey): string {
  if (charterCache.has(agent)) return charterCache.get(agent)!;
  const filePath = path.join(process.cwd(), "prompts", "agents", AGENT_FILES[agent]);
  const content = fs.readFileSync(filePath, "utf-8");
  charterCache.set(agent, content);
  return content;
}

export function parseRoute(text: string): AgentKey | null {
  const match = text.match(/\[ROUTE:(\w+)\]/);
  if (!match) return null;
  const key = match[1] as AgentKey;
  return key in AGENT_FILES ? key : null;
}

export function parseDocReady(text: string): boolean {
  return text.includes("[DOCREADY]");
}

export function parseDocType(text: string): string {
  const match = text.match(/\[DOCTYPE:([^\]]+)\]/);
  return match ? match[1] : "文件";
}

export function parseNeedsApproval(text: string): boolean {
  return text.includes("[NEEDS_APPROVAL]");
}

export function agentId(key: AgentKey): string {
  return AGENT_IDS[key];
}

export function agentName(key: AgentKey): string {
  const names: Record<AgentKey, string> = {
    dispatcher: "統籌助手",
    ada:        "課程顧問 Ada",
    ethan:      "試卷設計師 Ethan",
    carla:      "內容製作師 Carla",
    andy:       "校務行政 Andy",
    donna:      "數據分析師 Donna",
  };
  return names[key];
}

export function inferTitleFromContent(docType: string, content: string): string {
  const firstLine = content.split("\n").find((l) => l.trim())?.slice(0, 40) ?? "";
  return firstLine || docType;
}
