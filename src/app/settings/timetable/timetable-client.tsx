"use client";

import { useState, useRef } from "react";
import Link from "next/link";

interface UploadResult {
  parsed:   number;
  teachers: number;
  term:     string;
  errors:   { line: number; reason: string }[];
}

function currentTermDefault(): string {
  const now = new Date();
  const y = now.getFullYear();
  // 9 月起為新學年
  return now.getMonth() + 1 >= 9 ? `${y}-${(y + 1) % 100}` : `${y - 1}-${y % 100}`;
}

export default function TimetableClient() {
  const [term, setTerm]         = useState(currentTermDefault());
  const [replace, setReplace]   = useState(true);
  const [file, setFile]         = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult]     = useState<UploadResult | null>(null);
  const [error, setError]       = useState("");
  const fileRef                 = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    if (!file) { setError("請先選擇 CSV 檔案"); return; }
    if (!term.trim()) { setError("請輸入學期"); return; }
    setUploading(true);
    setError("");
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("term", term.trim());
      fd.append("replace", String(replace));
      const res = await fetch("/api/timetable/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "上載失敗");
        if (json.errors) setResult({ parsed: json.parsed ?? 0, teachers: 0, term, errors: json.errors });
      } else {
        setResult(json);
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
      }
    } catch {
      setError("網絡錯誤，請再試。");
    }
    setUploading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", fontFamily: "var(--sans)" }}>
      <div style={{ background: "var(--card)", borderBottom: "1px solid var(--border)", padding: "14px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/" style={{ color: "var(--primary)", textDecoration: "none", fontSize: 13 }}>← 返回工作台</Link>
        <span style={{ color: "var(--border)" }}>|</span>
        <h1 style={{ margin: 0, fontSize: 18, fontFamily: "var(--serif)", color: "var(--primary)", fontWeight: 700 }}>時間表上載</h1>
        <span style={{ marginLeft: "auto", fontSize: 10, fontFamily: "var(--mono)", color: "var(--seal)", border: "1px solid var(--seal)", padding: "2px 8px", borderRadius: 3 }}>
          ADMIN
        </span>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px" }}>
        {/* 格式說明 */}
        <div style={{
          background: "var(--primary-light)", border: "1px solid var(--primary)",
          borderRadius: 5, padding: "14px 18px", marginBottom: 24, fontSize: 13,
        }}>
          <strong style={{ color: "var(--primary)" }}>CSV 格式要求</strong>
          <pre style={{
            background: "var(--card)", borderRadius: 4, padding: "10px 14px",
            margin: "8px 0", fontFamily: "var(--mono)", fontSize: 12, overflowX: "auto",
          }}>{`老師,星期,節次,班別,科目
陳大文,1,1,3A,數學
陳大文,1,2,3B,數學
李小明,1,1,4C,英文`}</pre>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9, color: "var(--ink)" }}>
            <li>星期：1-5（星期一至五）；節次：1-9</li>
            <li>只需列出<strong>有課堂</strong>的時段，空堂無需記錄</li>
            <li>第一行如為標題列（包含「老師」字眼）會自動跳過</li>
          </ul>
        </div>

        {/* 上載表單 */}
        <div style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: 6, padding: 20, boxShadow: "3px 3px 0 var(--primary-light)",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>學期</label>
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="例：2025-26"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>CSV 檔案</label>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                style={{ ...inputStyle, padding: "6px 10px" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <input
              id="replace"
              type="checkbox"
              checked={replace}
              onChange={(e) => setReplace(e.target.checked)}
              style={{ accentColor: "var(--primary)", width: 14, height: 14 }}
            />
            <label htmlFor="replace" style={{ fontSize: 13, cursor: "pointer" }}>
              覆蓋模式：先清除該學期所有舊記錄再寫入（重新上載時建議勾選）
            </label>
          </div>

          {error && <p style={{ color: "var(--seal)", fontSize: 13, margin: "0 0 12px" }}>⚠ {error}</p>}

          <button
            onClick={handleUpload}
            disabled={uploading}
            style={{
              background: uploading ? "var(--ink3)" : "var(--primary)",
              color: "#fff", border: "none", borderRadius: 4,
              padding: "10px 28px", cursor: uploading ? "wait" : "pointer",
              fontSize: 14, fontWeight: 600, fontFamily: "var(--sans)",
              boxShadow: "2px 2px 0 var(--primary-light)",
            }}
          >
            {uploading ? "上載中…" : "上載時間表"}
          </button>
        </div>

        {/* 結果 */}
        {result && (
          <div style={{
            marginTop: 20, background: "var(--card)",
            border: `2px solid ${result.errors.length > 0 ? "var(--amber)" : "var(--green)"}`,
            borderRadius: 6, padding: 18,
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--green)", marginBottom: 8 }}>
              ✓ 上載完成（{result.term}）
            </div>
            <div style={{ display: "flex", gap: 24, fontSize: 13, marginBottom: result.errors.length > 0 ? 12 : 0 }}>
              <span>📥 寫入記錄：<strong>{result.parsed}</strong> 筆</span>
              <span>👤 老師數目：<strong>{result.teachers}</strong> 位</span>
              <span>⚠ 錯誤行：<strong style={{ color: result.errors.length > 0 ? "var(--amber)" : "var(--green)" }}>{result.errors.length}</strong></span>
            </div>
            {result.errors.length > 0 && (
              <div style={{
                background: "var(--bg2)", borderRadius: 4, padding: "10px 14px",
                fontSize: 12, fontFamily: "var(--mono)", maxHeight: 200, overflowY: "auto",
              }}>
                {result.errors.map((e, i) => (
                  <div key={i} style={{ color: "var(--amber)", lineHeight: 1.8 }}>
                    第 {e.line} 行：{e.reason}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
