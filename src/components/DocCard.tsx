"use client";

import { useState } from "react";

interface DocCardProps {
  documentId:    string;
  title:         string;
  docType:       string;
  needsApproval?: boolean;
}

export default function DocCard({ documentId, title, docType, needsApproval }: DocCardProps) {
  const [downloading, setDownloading] = useState<"docx" | "pdf" | null>(null);

  async function download(format: "docx" | "pdf") {
    setDownloading(format);
    try {
      const res = await fetch("/api/doc", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ documentId, format }),
      });
      if (!res.ok) throw new Error("下載失敗");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${title}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("下載失敗，請再試。");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div
      style={{
        background:   "var(--card)",
        border:       "1px solid var(--border2)",
        borderRadius: 5,
        padding:      "14px 16px",
        position:     "relative",
        boxShadow:    "2px 2px 0 var(--primary-light)",
        marginTop:    8,
        maxWidth:     480,
      }}
    >
      {/* 基智·KCSS 印章 */}
      <div
        style={{
          position:   "absolute",
          top:        10,
          right:      12,
          fontSize:   9,
          fontFamily: "var(--mono)",
          color:      "var(--seal)",
          border:     "1px solid var(--seal)",
          padding:    "1px 5px",
          borderRadius: 2,
        }}
      >
        基智 · KCSS
      </div>

      {/* 文件類型標籤 */}
      <div
        style={{
          fontSize:    9,
          fontFamily:  "var(--mono)",
          color:       "var(--primary)",
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 4,
        }}
      >
        {docType}
      </div>

      {/* 標題 */}
      <div
        style={{
          fontSize:    14,
          fontWeight:  600,
          color:       "var(--ink)",
          fontFamily:  "var(--serif)",
          marginBottom: 12,
          paddingRight: 60,
        }}
      >
        {title}
      </div>

      {needsApproval && (
        <div
          style={{
            fontSize:    11,
            color:       "var(--amber)",
            background:  "#FFF8ED",
            border:      "1px solid var(--amber)",
            borderRadius: 3,
            padding:     "4px 10px",
            marginBottom: 10,
          }}
        >
          ⚠ 需要副校長批核後方可發出
        </div>
      )}

      {/* 下載按鈕 */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={() => download("docx")}
          disabled={downloading === "docx"}
          style={{
            padding:      "7px 14px",
            background:   "var(--primary)",
            color:        "#fff",
            border:       "none",
            borderRadius: 3,
            fontSize:     12,
            fontWeight:   600,
            cursor:       downloading ? "wait" : "pointer",
            fontFamily:   "var(--sans)",
            boxShadow:    "1px 1px 0 var(--primary-light)",
            opacity:      downloading === "docx" ? 0.7 : 1,
          }}
        >
          {downloading === "docx" ? "生成中…" : "⬇ Word"}
        </button>
        <button
          onClick={() => download("pdf")}
          disabled={downloading === "pdf"}
          style={{
            padding:      "7px 14px",
            background:   "var(--seal)",
            color:        "#fff",
            border:       "none",
            borderRadius: 3,
            fontSize:     12,
            fontWeight:   600,
            cursor:       downloading ? "wait" : "pointer",
            fontFamily:   "var(--sans)",
            boxShadow:    "1px 1px 0 var(--primary-light)",
            opacity:      downloading === "pdf" ? 0.7 : 1,
          }}
        >
          {downloading === "pdf" ? "生成中…" : "⬇ PDF"}
        </button>
      </div>
    </div>
  );
}
