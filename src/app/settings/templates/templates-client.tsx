"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

const DOC_TYPE_LABELS: Record<string, string> = {
  exam:            "試卷",
  worksheet:       "工作紙",
  "unit-plan":     "課程單元計劃",
  notes:           "學生筆記",
  "parent-notice": "家長通告",
  "dept-notice":   "科組通告",
  "meeting-minutes": "會議記錄",
  "event-plan":    "活動計劃",
  report:          "報告",
  other:           "其他",
};

const DOC_TYPE_OPTIONS = Object.entries(DOC_TYPE_LABELS);

interface Template {
  id:        string;
  docType:   string;
  name:      string;
  content:   string;
  isDefault: boolean;
}

const EMPTY_FORM = { docType: "exam", name: "", content: "", isDefault: false };

export default function TemplatesClient() {
  const [templates, setTemplates]     = useState<Template[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState({ ...EMPTY_FORM });
  const [editId, setEditId]           = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const textareaRef                   = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { loadTemplates(); }, []);
  useEffect(() => {
    if (showForm && textareaRef.current) textareaRef.current.focus();
  }, [showForm]);

  async function loadTemplates() {
    setLoading(true);
    const res = await fetch("/api/templates");
    if (res.ok) setTemplates(await res.json());
    setLoading(false);
  }

  function startCreate() {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setError("");
    setShowForm(true);
  }

  function startEdit(t: Template) {
    setEditId(t.id);
    setForm({ docType: t.docType, name: t.name, content: t.content, isDefault: t.isDefault });
    setError("");
    setShowForm(true);
    setExpandedId(null);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.content.trim()) {
      setError("名稱及內容為必填");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const url    = editId ? `/api/templates/${editId}` : "/api/templates";
      const method = editId ? "PATCH" : "POST";
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) {
        const j = await res.json();
        setError(j.error ?? "儲存失敗");
      } else {
        setShowForm(false);
        setEditId(null);
        await loadTemplates();
      }
    } catch {
      setError("網絡錯誤");
    }
    setSaving(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`確定刪除「${name}」？`)) return;
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    await loadTemplates();
  }

  async function toggleDefault(t: Template) {
    await fetch(`/api/templates/${t.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ isDefault: !t.isDefault }),
    });
    await loadTemplates();
  }

  // Group by docType
  const grouped = templates.reduce<Record<string, Template[]>>((acc, t) => {
    (acc[t.docType] ??= []).push(t);
    return acc;
  }, {});

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", fontFamily: "var(--sans)" }}>
      {/* Header bar */}
      <div style={{ background: "var(--card)", borderBottom: "1px solid var(--border)", padding: "14px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/" style={{ color: "var(--primary)", textDecoration: "none", fontSize: 13 }}>← 返回工作台</Link>
        <span style={{ color: "var(--border)" }}>|</span>
        <h1 style={{ margin: 0, fontSize: 18, fontFamily: "var(--serif)", color: "var(--primary)", fontWeight: 700 }}>範本庫</h1>
        <span style={{ marginLeft: "auto" }}>
          <button
            onClick={startCreate}
            style={{
              background: "var(--primary)", color: "#fff", border: "none",
              borderRadius: 4, padding: "7px 16px", cursor: "pointer",
              fontSize: 13, fontFamily: "var(--sans)",
              boxShadow: "2px 2px 0 var(--primary-light)",
            }}
          >
            + 新增範本
          </button>
        </span>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px" }}>
        {/* Create / Edit Form */}
        {showForm && (
          <div style={{
            background: "var(--card)", border: "2px solid var(--primary)",
            borderRadius: 6, padding: 20, marginBottom: 24,
            boxShadow: "3px 3px 0 var(--primary-light)",
          }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 16, fontFamily: "var(--serif)", color: "var(--primary)" }}>
              {editId ? "編輯範本" : "新增範本"}
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              {/* docType */}
              <div>
                <label style={labelStyle}>文件類型</label>
                <select
                  value={form.docType}
                  onChange={(e) => setForm((f) => ({ ...f, docType: e.target.value }))}
                  style={inputStyle}
                >
                  {DOC_TYPE_OPTIONS.map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              {/* name */}
              <div>
                <label style={labelStyle}>範本名稱</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="例：標準家長通告格式"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* content */}
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>
                範本內容
                <span style={{ marginLeft: 8, fontSize: 11, color: "var(--ink3)", fontWeight: 400 }}>
                  使用 {"{{佔位符}}"} 標記可替換位置（如 {"{{活動名稱}}"}、{"{{日期}}"}）
                </span>
              </label>
              <textarea
                ref={textareaRef}
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder={"# {{活動名稱}} 家長通告\n\n親愛的家長，\n\n本校將於 {{日期}} 舉辦 {{活動名稱}}。\n\n{{學校名稱}}"}
                rows={12}
                style={{ ...inputStyle, fontFamily: "var(--mono)", fontSize: 12, lineHeight: 1.6, resize: "vertical" }}
              />
            </div>

            {/* isDefault */}
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <input
                id="isDefault"
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                style={{ accentColor: "var(--primary)", width: 14, height: 14 }}
              />
              <label htmlFor="isDefault" style={{ fontSize: 13, color: "var(--ink)", cursor: "pointer" }}>
                設為此類型的預設範本（Agent 生成時自動參考此格式）
              </label>
            </div>

            {error && <p style={{ color: "var(--seal)", fontSize: 13, margin: "0 0 12px" }}>{error}</p>}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleSave} disabled={saving} style={btnPrimary}>
                {saving ? "儲存中…" : "儲存"}
              </button>
              <button onClick={() => { setShowForm(false); setEditId(null); }} style={btnSecondary}>
                取消
              </button>
            </div>
          </div>
        )}

        {/* Template list */}
        {loading ? (
          <p style={{ color: "var(--ink3)", textAlign: "center", padding: 40 }}>載入中…</p>
        ) : Object.keys(grouped).length === 0 && !showForm ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--ink3)" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
            <p style={{ fontSize: 14 }}>尚未建立任何範本</p>
            <p style={{ fontSize: 12 }}>點擊「新增範本」開始建立，Agent 生成文件時將自動套用預設範本的格式。</p>
          </div>
        ) : (
          DOC_TYPE_OPTIONS
            .filter(([val]) => grouped[val])
            .map(([docType, label]) => (
              <div key={docType} style={{ marginBottom: 24 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  marginBottom: 10, paddingBottom: 6,
                  borderBottom: "2px solid var(--primary-light)",
                }}>
                  <span style={{
                    fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600,
                    color: "#fff", background: "var(--primary)",
                    padding: "2px 8px", borderRadius: 3,
                  }}>{label}</span>
                  <span style={{ fontSize: 12, color: "var(--ink3)" }}>
                    {grouped[docType].length} 個範本
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {grouped[docType].map((t) => (
                    <div
                      key={t.id}
                      style={{
                        background: "var(--card)", border: "1px solid var(--border)",
                        borderRadius: 5, overflow: "hidden",
                        boxShadow: t.isDefault ? "2px 2px 0 var(--primary)" : "1px 1px 0 var(--card)",
                        borderLeft: t.isDefault ? "3px solid var(--primary)" : "3px solid var(--border)",
                      }}
                    >
                      {/* Row */}
                      <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", gap: 10 }}>
                        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
                          {t.name}
                        </span>
                        {t.isDefault && (
                          <span style={{
                            fontSize: 10, color: "var(--primary)", fontFamily: "var(--mono)",
                            background: "var(--primary-light)", padding: "2px 7px", borderRadius: 3,
                          }}>預設</span>
                        )}
                        <button
                          onClick={() => toggleDefault(t)}
                          title={t.isDefault ? "取消預設" : "設為預設"}
                          style={{
                            background: "none", border: "1px solid var(--border)", borderRadius: 3,
                            padding: "3px 8px", cursor: "pointer", fontSize: 11,
                            color: t.isDefault ? "var(--primary)" : "var(--ink3)",
                          }}
                        >
                          {t.isDefault ? "★ 預設" : "☆ 設預設"}
                        </button>
                        <button
                          onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--ink3)" }}
                        >
                          {expandedId === t.id ? "▲ 收起" : "▼ 預覽"}
                        </button>
                        <button onClick={() => startEdit(t)} style={btnSmall}>編輯</button>
                        <button onClick={() => handleDelete(t.id, t.name)} style={{ ...btnSmall, color: "var(--seal)", borderColor: "var(--seal)" }}>刪除</button>
                      </div>

                      {/* Preview */}
                      {expandedId === t.id && (
                        <div style={{
                          borderTop: "1px solid var(--border)", padding: "12px 16px",
                          background: "var(--bg2)",
                          fontFamily: "var(--mono)", fontSize: 12, lineHeight: 1.7,
                          whiteSpace: "pre-wrap", color: "var(--ink)", maxHeight: 300, overflowY: "auto",
                        }}>
                          {t.content}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
        )}

        {/* Hint box */}
        <div style={{
          marginTop: 32, padding: "14px 18px",
          background: "var(--primary-light)", borderRadius: 5,
          border: "1px solid var(--primary)", fontSize: 13,
        }}>
          <strong style={{ color: "var(--primary)" }}>💡 使用說明</strong>
          <ul style={{ margin: "6px 0 0", paddingLeft: 20, color: "var(--ink)", lineHeight: 2 }}>
            <li>設為「預設」的範本會在 Agent 生成對應類型文件時自動作為格式參考</li>
            <li>使用 <code style={{ background: "var(--card)", padding: "1px 5px", borderRadius: 3 }}>{"{{佔位符}}"}</code> 標記可替換位置，Agent 會根據對話內容填充</li>
            <li>每種文件類型只能有一個預設範本；設定新預設會自動取消舊的</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: "var(--ink3)", marginBottom: 5,
};
const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  border: "1px solid var(--border)", borderRadius: 4,
  padding: "8px 10px", fontSize: 13,
  background: "var(--bg)", color: "var(--ink)",
  fontFamily: "var(--sans)",
};
const btnPrimary: React.CSSProperties = {
  background: "var(--primary)", color: "#fff", border: "none",
  borderRadius: 4, padding: "8px 20px", cursor: "pointer",
  fontSize: 13, fontFamily: "var(--sans)",
  boxShadow: "2px 2px 0 var(--primary-light)",
};
const btnSecondary: React.CSSProperties = {
  background: "none", color: "var(--ink3)",
  border: "1px solid var(--border)", borderRadius: 4,
  padding: "8px 20px", cursor: "pointer",
  fontSize: 13, fontFamily: "var(--sans)",
};
const btnSmall: React.CSSProperties = {
  background: "none", border: "1px solid var(--border)",
  borderRadius: 3, padding: "3px 9px",
  cursor: "pointer", fontSize: 11, color: "var(--ink3)",
};
