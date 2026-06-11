"use client";

import { useEffect, useState } from "react";
import Header, { type AgentStatus } from "@/components/Header";
import SkillRail from "@/components/SkillRail";
import ChatPanel from "@/components/ChatPanel";
import SettingsModal, {
  type EngineSettings,
  DEFAULT_ENGINE_SETTINGS,
  loadEngineSettings,
  saveEngineSettings,
} from "@/components/SettingsModal";

export default function WorkspaceClient() {
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({});
  const [promptTrigger, setPromptTrigger] = useState<string>("");
  const [engineSettings, setEngineSettings] = useState<EngineSettings>(DEFAULT_ENGINE_SETTINGS);
  const [showSettings, setShowSettings]   = useState(false);

  useEffect(() => {
    setEngineSettings(loadEngineSettings());
  }, []);

  function handleAgentStatus(agentId: string, status: AgentStatus) {
    setAgentStatuses((prev) => ({ ...prev, [agentId]: status }));
  }

  function handleSaveSettings(s: EngineSettings) {
    setEngineSettings(s);
    saveEngineSettings(s);
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "var(--sans)" }}>
      <Header
        agentStatuses={agentStatuses}
        engine={engineSettings.engine}
        onOpenSettings={() => setShowSettings(true)}
      />
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <SkillRail onPrompt={(p) => setPromptTrigger(p)} />
        <ChatPanel
          onAgentStatus={handleAgentStatus}
          initialPrompt={promptTrigger}
          engine={engineSettings.engine}
          engineConfig={{ baseUrl: engineSettings.baseUrl, model: engineSettings.model }}
        />
      </div>
      {showSettings && (
        <SettingsModal
          settings={engineSettings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
