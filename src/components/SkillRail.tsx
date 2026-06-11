"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Task {
  id:       string;
  title:    string;
  agentId:  string;
  status:   "RUNNING" | "DONE" | "FAILED" | "PENDING_APPROVAL";
  createdAt: string;
}

interface SkillCard {
  id:    string;
  icon:  string;
  label: string;
  color: string;
  href?: string;
}

const SKILL_CARDS: { section: string; cards: SkillCard[] }[] = [
  {
    section: "時間表 · 代課",
    cards: [
      { id: "sub-notice",  icon: "📋", label: "代課安排通告", color: "var(--primary-light)" },
      { id: "free-slot",   icon: "🔍", label: "夾空堂",      color: "var(--primary-light)" },
      { id: "find-free",   icon: "👤", label: "找空堂老師",  color: "var(--bg2)" },
      { id: "sub-history", icon: "📂", label: "代課記錄",    color: "var(--bg2)" },
    ],
  },
  {
    section: "校務行政",
    cards: [
      { id: "parent-notice",   icon: "✉️", label: "家長通告",   color: "var(--primary-light)" },
      { id: "activity-notice", icon: "📋", label: "活動通告",   color: "var(--bg2)",          href: "/tools/notice" },
      { id: "procurement",     icon: "🛒", label: "口頭報價表", color: "var(--primary-light)", href: "/tools/quotation" },
      { id: "outing-permit",   icon: "🚪", label: "外出許可",   color: "var(--bg2)" },
      { id: "event-form",      icon: "📝", label: "活動報名表", color: "var(--primary-light)" },
      { id: "meeting-minutes", icon: "🗒️", label: "會議記錄",  color: "var(--bg2)" },
    ],
  },
  {
    section: "教學 · 試卷",
    cards: [
      { id: "exam",       icon: "📄", label: "出試卷",      color: "var(--primary-light)" },
      { id: "worksheet",  icon: "✏️", label: "出工作紙",    color: "var(--bg2)" },
      { id: "unit-plan",  icon: "📚", label: "課程單元計劃", color: "var(--primary-light)" },
      { id: "notes",      icon: "📖", label: "學生筆記",    color: "var(--bg2)" },
      { id: "grade",      icon: "📊", label: "成績分析",    color: "var(--primary-light)" },
    ],
  },
  {
    section: "其他",
    cards: [
      { id: "custom",      icon: "💬", label: "自訂對話",   color: "var(--bg2)" },
      { id: "dept-notice", icon: "📢", label: "科組通告",   color: "var(--primary-light)" },
      { id: "study-plan",  icon: "🎯", label: "學習計劃",   color: "var(--bg2)" },
      { id: "event-plan",  icon: "📅", label: "活動計劃",   color: "var(--primary-light)" },
      { id: "templates",   icon: "📚", label: "範本庫",     color: "var(--bg2)",          href: "/settings/templates" },
    ],
  },
];

const SKILL_PROMPTS: Record<string, string> = {
  "sub-notice":      "幫我出代課安排通告",
  "free-slot":       "幫我夾空堂，找共同空檔",
  "find-free":       "幫我找這個時段有空的老師",
  "sub-history":     "查看代課記錄",
  "parent-notice":   "幫我出家長通告",
  "outing-permit":   "幫我出學生外出許可表",
  "procurement":     "幫我出採購申請表",
  "event-form":      "幫我出活動報名表",
  "meeting-minutes": "幫我整理會議記錄",
  "exam":            "幫我出試卷",
  "worksheet":       "幫我出工作紙",
  "unit-plan":       "幫我設計課程單元計劃",
  "notes":           "幫我製作學生筆記",
  "grade":           "幫我分析班級成績",
  "custom":          "",
  "dept-notice":     "幫我出科組通告",
  "study-plan":      "幫我制訂學習計劃",
  "event-plan":      "幫我制訂活動計劃",
};

const STATUS_COLOR: Record<string, string> = {
  RUNNING:          "var(--amber)",
  DONE:             "var(--green)",
  FAILED:           "var(--seal)",
  PENDING_APPROVAL: "var(--primary)",
};

const STATUS_LABEL: Record<string, string> = {
  RUNNING:          "處理中",
  DONE:             "完成",
  FAILED:           "失敗",
  PENDING_APPROVAL: "待批核",
};

interface SkillRailProps {
  onPrompt: (text: string) => void;
}

export default function SkillRail({ onPrompt }: SkillRailProps) {
  const [tasks, setTasks]       = useState<Task[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 15000);
    return () => clearInterval(interval);
  }, []);

  async function fetchTasks() {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) setTasks(await res.json());
    } catch {}
  }

  if (collapsed) {
    return (
      <aside
        style={{
          width:        40,
          background:   "var(--bg2)",
          borderRight:  "1px solid var(--border)",
          display:      "flex",
          flexDirection: "column",
          alignItems:   "center",
          paddingTop:   12,
        }}
      >
        <button
          onClick={() => setCollapsed(false)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--primary)" }}
          title="展開功能欄"
        >
          ›
        </button>
      </aside>
    );
  }

  return (
    <aside
      style={{
        width:        240,
        background:   "var(--bg2)",
        borderRight:  "1px solid var(--border)",
        display:      "flex",
        flexDirection: "column",
        overflowY:    "auto",
        flexShrink:   0,
      }}
    >
      {/* 收起按鈕 */}
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 10px 0" }}>
        <button
          onClick={() => setCollapsed(true)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--ink3)" }}
          title="收起"
        >
          ‹
        </button>
      </div>

      {/* 功能卡 */}
      {SKILL_CARDS.map((section) => (
        <div key={section.section} style={{ padding: "8px 10px 4px" }}>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize:   9,
              fontWeight: 600,
              color:      "var(--primary)",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom:  6,
              paddingLeft:   6,
              borderLeft:    "3px solid var(--primary)",
            }}
          >
            {section.section}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
            {section.cards.map((card) => {
              const cardStyle = {
                background:    card.color,
                border:        "1px solid var(--border)",
                borderRadius:  4,
                padding:       "8px 6px",
                cursor:        "pointer",
                textAlign:     "left" as const,
                boxShadow:     "1px 1px 0 var(--card)",
                transition:    "box-shadow 0.1s",
                display:       "flex",
                flexDirection: "column" as const,
                gap:           2,
                textDecoration: "none",
              };
              const inner = (
                <>
                  <span style={{ fontSize: 14 }}>{card.icon}</span>
                  <span style={{ fontSize: 10, color: "var(--ink)", lineHeight: 1.3, fontFamily: "var(--sans)" }}>
                    {card.label}
                  </span>
                </>
              );
              if (card.href) {
                return (
                  <Link
                    key={card.id}
                    href={card.href}
                    style={cardStyle}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = "2px 2px 0 var(--primary)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = "1px 1px 0 var(--card)")}
                  >
                    {inner}
                  </Link>
                );
              }
              return (
                <button
                  key={card.id}
                  onClick={() => {
                    const prompt = SKILL_PROMPTS[card.id];
                    if (prompt) onPrompt(prompt);
                  }}
                  style={cardStyle}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "2px 2px 0 var(--primary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "1px 1px 0 var(--card)")}
                >
                  {inner}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* 任務進度 */}
      <div style={{ marginTop: "auto", padding: "12px 10px", borderTop: "1px solid var(--border)" }}>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize:   9,
            fontWeight: 600,
            color:      "var(--primary)",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom:  8,
            paddingLeft:   6,
            borderLeft:    "3px solid var(--primary)",
          }}
        >
          最近任務
        </div>
        {tasks.length === 0 && (
          <p style={{ fontSize: 11, color: "var(--ink3)", textAlign: "center", padding: "8px 0" }}>暫無任務</p>
        )}
        {tasks.map((task) => (
          <div
            key={task.id}
            style={{
              padding:      "6px 8px",
              marginBottom: 4,
              borderRadius: 3,
              background:   "var(--card)",
              border:       "1px solid var(--border)",
              boxShadow:    "1px 1px 0 var(--primary-light)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width:        6,
                  height:       6,
                  borderRadius: "50%",
                  background:   STATUS_COLOR[task.status] ?? "var(--ink3)",
                  flexShrink:   0,
                }}
              />
              <span style={{ fontSize: 10, color: "var(--ink)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {task.title}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
              <span style={{ fontSize: 9, color: STATUS_COLOR[task.status], fontFamily: "var(--mono)" }}>
                {STATUS_LABEL[task.status]}
              </span>
              <span style={{ fontSize: 9, color: "var(--ink3)", fontFamily: "var(--mono)" }}>
                {task.agentId}
              </span>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
