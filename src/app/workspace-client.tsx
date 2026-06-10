"use client";

import { useState } from "react";
import Header, { type AgentStatus } from "@/components/Header";
import SkillRail from "@/components/SkillRail";
import ChatPanel from "@/components/ChatPanel";

export default function WorkspaceClient() {
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({});
  const [promptTrigger, setPromptTrigger] = useState<string>("");
  const [engine] = useState<string>("claude");

  function handleAgentStatus(agentId: string, status: AgentStatus) {
    setAgentStatuses((prev) => ({ ...prev, [agentId]: status }));
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "var(--sans)" }}>
      <Header agentStatuses={agentStatuses} engine={engine} />
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <SkillRail onPrompt={(p) => setPromptTrigger(p)} />
        <ChatPanel
          onAgentStatus={handleAgentStatus}
          initialPrompt={promptTrigger}
          engine={engine}
        />
      </div>
    </div>
  );
}
