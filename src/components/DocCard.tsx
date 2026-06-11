"use client";

import { useEffect, useRef, useState } from "react";

interface DocCardProps {
  documentId:    string;
  title:         string;
  docType:       string;
  needsApproval?: boolean;
}

type ApprovalStatus = "NOT_REQUIRED" | "PENDING" | "APPROVED" | "REJECTED";

export default function DocCard({ documentId, title, docType, needsApproval }: DocCardProps) {
  const [downloading,     setDownloading]     = useState<"docx" | "pdf" | null>(null);
  const [showWa,          setShowWa]          = useState(false);
  const [recipients,      setRecipients]      = useState("");
  const [waState,         setWaState]         = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [waError,         setWaError]         = useState("");
  const [approvalStatus,  setApprovalStatus]  = useState<ApprovalStatus>(
    needsApproval ? "PENDING" : "NOT_REQUIRED"
  );
  const [driveUrl,        setDriveUrl]        = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchStatus();
  }, [documentId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (approvalStatus === "PENDING") {
      pollRef.current = setInterval(fetchStatus, 10_000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [approvalStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchStatus() {
    try {
      const res = await fetch(`/api/doc?id=${documentId}`);
      if (!res.ok) return;
      const data = await res.json();
      setApprovalStatus(data.approvalStatus ?? "NOT_REQUIRED");
      setDriveUrl(data.driveUrl ?? null);
      setRejectionReason(data.rejectionReason ?? null);
    } catch {}
  }

  async function pushWhatsApp() {
    const list = recipients.split(/[,，;；\n]/).map((r) => r.trim()).filter(Boolean);
    if (list.length === 0) { setWaError("請輸入至少一位收件人"); return; }
    setWaState("sending");
    setWaError("");
    try {
      const res = await fetch("/api/notify", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ documentId, title, recipients: list }),
      });
      const json = await res.json();
      if (!res.ok) { setWaState("error"); setWaError(json.error ?? "推送失敗"); }
      else          setWaState("sent");
    } catch {
      setWaState("error");
      setWaError("網絡錯誤，請再試。");
    }
  }

  async function download(format: "docx" | "pdf") {
    setDownloading(format);
    try {
      const res = await fetch("/api/doc", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ documentId, format }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "下載失敗");
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${title}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "下載失敗，請再試。");
    } finally {
      setDownloading(null);
    }
  }

  const locked = approvalStatus === "PENDING" || approvalStatus === "REJECTED";

  return (
    <div
      style={{
        background:   "var(--card)",
        border:       "1px solid var(--border2)",
        borderLeft:   `4px solid ${
          approvalStatus === "APPROVED"  ? "var(--green)" :
          approvalStatus === "PENDING"   ? "var(--amber)" :
          approvalStatus === "REJECTED"  ? "var(--seal)"  :
          "var(--primary)"
        }`,
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
          fontSize:      9,
          fontFamily:    "var(--mono)",
          color:         "var(--primary)",
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom:  4,
        }}
      >
        {docType}
      </div>

      {/* 標題 */}
      <div
        style={{
          fontSize:     14,
          fontWeight:   600,
          color:        "var(--ink)",
          fontFamily:   "var(--serif)",
          marginBottom: 10,
          paddingRight: 60,
        }}
      >
        {title}
      </div>

      {/* Approval status banner */}
      {approvalStatus === "PENDING" && (
        <div style={{
          fontSize: 11, color: "var(--amber)",
          background: "#FFF8ED", border: "1px solid var(--amber)",
          borderRadius: 3, padding: "5px 10px", marginBottom: 10,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span>🔒</span>
          <span>待副校長批核中，批核後方可下載及發出</span>
        </div>
      )}
      {approvalStatus === "APPROVED" && (
        <div style={{
          fontSize: 11, color: "var(--green)",
          background: "rgba(46,125,50,0.08)", border: "1px solid var(--green)",
          borderRadius: 3, padding: "5px 10px", marginBottom: 10,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span>✓ 已批核，可下載及發出</span>
          {driveUrl && (
            <a href={driveUrl} target="_blank" rel="noopener noreferrer"
              style={{ marginLeft: "auto", color: "var(--green)", fontSize: 11, fontFamily: "var(--mono)" }}>
              📁 Drive
            </a>
          )}
        </div>
      )}
      {approvalStatus === "REJECTED" && (
        <div style={{
          fontSize: 11, color: "var(--seal)",
          background: "rgba(184,64,48,0.08)", border: "1px solid var(--seal)",
          borderRadius: 3, padding: "5px 10px", marginBottom: 10,
        }}>
          ✗ 已退回{rejectionReason ? `：${rejectionReason}` : ""}
        </div>
      )}

      {/* 下載按鈕 */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={() => download("docx")}
          disabled={downloading === "docx" || locked}
          style={{
            padding:      "7px 14px",
            background:   locked ? "var(--ink3)" : "var(--primary)",
            color:        "#fff",
            border:       "none",
            borderRadius: 3,
            fontSize:     12,
            fontWeight:   600,
            cursor:       locked ? "not-allowed" : downloading ? "wait" : "pointer",
            fontFamily:   "var(--sans)",
            boxShadow:    locked ? "none" : "1px 1px 0 var(--primary-light)",
            opacity:      downloading === "docx" ? 0.7 : 1,
          }}
        >
          {downloading === "docx" ? "生成中…" : locked ? "🔒 Word" : "⬇ Word"}
        </button>
        <button
          onClick={() => download("pdf")}
          disabled={downloading === "pdf" || locked}
          style={{
            padding:      "7px 14px",
            background:   locked ? "var(--ink3)" : "var(--seal)",
            color:        "#fff",
            border:       "none",
            borderRadius: 3,
            fontSize:     12,
            fontWeight:   600,
            cursor:       locked ? "not-allowed" : downloading ? "wait" : "pointer",
            fontFamily:   "var(--sans)",
            boxShadow:    locked ? "none" : "1px 1px 0 var(--primary-light)",
            opacity:      downloading === "pdf" ? 0.7 : 1,
          }}
        >
          {downloading === "pdf" ? "生成中…" : locked ? "🔒 PDF" : "⬇ PDF"}
        </button>
        {!locked && (
          <button
            onClick={() => setShowWa((v) => !v)}
            style={{
              padding:      "7px 14px",
              background:   waState === "sent" ? "var(--green)" : "#25D366",
              color:        "#fff",
              border:       "none",
              borderRadius: 3,
              fontSize:     12,
              fontWeight:   600,
              cursor:       "pointer",
              fontFamily:   "var(--sans)",
              boxShadow:    "1px 1px 0 var(--primary-light)",
            }}
          >
            {waState === "sent" ? "✓ 已推送" : "📲 WhatsApp 推送"}
          </button>
        )}
      </div>

      {/* WhatsApp 收件人面板 */}
      {showWa && waState !== "sent" && (
        <div style={{
          marginTop: 10, padding: "10px 12px",
          background: "var(--bg2)", borderRadius: 4,
          border: "1px solid var(--border)",
        }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--ink3)", marginBottom: 5 }}>
            收件人（電話號碼或群組名，以逗號分隔）
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="例：85291234567, 教務組群組"
              style={{
                flex: 1, border: "1px solid var(--border)", borderRadius: 3,
                padding: "6px 10px", fontSize: 12,
                background: "var(--card)", color: "var(--ink)",
                fontFamily: "var(--sans)", outline: "none",
              }}
            />
            <button
              onClick={pushWhatsApp}
              disabled={waState === "sending"}
              style={{
                padding: "6px 14px", background: "#25D366", color: "#fff",
                border: "none", borderRadius: 3, fontSize: 12, fontWeight: 600,
                cursor: waState === "sending" ? "wait" : "pointer",
                fontFamily: "var(--sans)", opacity: waState === "sending" ? 0.7 : 1,
              }}
            >
              {waState === "sending" ? "推送中…" : "發送"}
            </button>
          </div>
          {waError && <p style={{ color: "var(--seal)", fontSize: 11, margin: "6px 0 0" }}>⚠ {waError}</p>}
        </div>
      )}
    </div>
  );
}
