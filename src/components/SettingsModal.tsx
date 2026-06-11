"use client";

import { useState } from "react";

export interface EngineSettings {
  engine:  "claude" | "ollama" | "lmstudio";
  baseUrl: string;
  model:   string;
}

export const DEFAULT_ENGINE_SETTINGS: EngineSettings = {
  engine:  "claude",
  baseUrl: "",
  model:   "",
};

export function loadEngineSettings(): EngineSettings {
  if (typeof window === "undefined") return DEFAULT_ENGINE_SETTINGS;
  try {
    const raw = localStorage.getItem("kc-engine-settings");
    if (raw) return { ...DEFAULT_ENGINE_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_ENGINE_SETTINGS;
}

export function saveEngineSettings(s: EngineSettings) {
  try { localStorage.setItem("kc-engine-settings", JSON.stringify(s)); } catch {}
}

const ENGINE_OPTIONS = [
  { value: "claude",   label: "Claude（雲端）",   hint: "Anthropic API，能力最強。敏感數據（如學生成績）建議用本地引擎。" },
  { value: "ollama",   label: "Ollama（本地）",   hint: "預設 http://localhost:11434，數據不出校。" },
  { value: "lmstudio", label: "LM Studio（本地）", hint: "預設 http://localhost:1234，數據不出校。" },
] as const;

interface SettingsModalProps {
  settings: EngineSettings;
  onSave:   (s: EngineSettings) => void;
  onClose:  () => void;
}

export default function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
  const [form, setForm] = useState<EngineSettings>({ ...settings });

  const isLocal = form.engine !== "claude";

  function handleSave() {
    onSave(form);
    onClose();
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(26,36,48,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--card)", borderRadius: 6,
          border: "2px solid var(--primary)",
          boxShadow: "4px 4px 0 var(--primary-light)",
          width: 440, maxWidth: "92vw", padding: 22,
          fontFamily: "var(--sans)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontFamily: "var(--serif)", color: "var(--primary)" }}>
            ⚙ 引擎設定
          </h2>
          <button
            onClick={onClose}
            style={{ marginLeft: "auto", background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--ink3)" }}
          >
            ✕
          </button>
        </div>

        {/* 引擎選擇 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {ENGINE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                padding: "10px 12px", borderRadius: 4, cursor: "pointer",
                border: form.engine === opt.value ? "2px solid var(--primary)" : "1px solid var(--border)",
                background: form.engine === opt.value ? "var(--primary-light)" : "var(--bg)",
              }}
            >
              <input
                type="radio"
                name="engine"
                checked={form.engine === opt.value}
                onChange={() => setForm((f) => ({ ...f, engine: opt.value }))}
                style={{ accentColor: "var(--primary)", marginTop: 3 }}
              />
              <span>
                <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{opt.label}</span>
                <span style={{ display: "block", fontSize: 11, color: "var(--ink3)", marginTop: 2, lineHeight: 1.5 }}>{opt.hint}</span>
              </span>
            </label>
          ))}
        </div>

        {/* 本地引擎設定 */}
        {isLocal && (
          <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink3)", marginBottom: 4 }}>
                伺服器 URL（留空用預設）
              </label>
              <input
                value={form.baseUrl}
                onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
                placeholder={form.engine === "ollama" ? "http://localhost:11434" : "http://localhost:1234"}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink3)", marginBottom: 4 }}>
                模型名稱
              </label>
              <input
                value={form.model}
                onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                placeholder="例：llama3 / qwen2.5:14b"
                style={inputStyle}
              />
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              background: "none", color: "var(--ink3)",
              border: "1px solid var(--border)", borderRadius: 4,
              padding: "8px 18px", cursor: "pointer", fontSize: 13, fontFamily: "var(--sans)",
            }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            style={{
              background: "var(--primary)", color: "#fff", border: "none",
              borderRadius: 4, padding: "8px 22px", cursor: "pointer",
              fontSize: 13, fontWeight: 600, fontFamily: "var(--sans)",
              boxShadow: "2px 2px 0 var(--primary-light)",
            }}
          >
            儲存
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  border: "1px solid var(--border)", borderRadius: 4,
  padding: "8px 10px", fontSize: 13,
  background: "var(--bg)", color: "var(--ink)",
  fontFamily: "var(--mono)", outline: "none",
};
