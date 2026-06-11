"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ApprovalDoc {
  id:              string;
  title:           string;
  docType:         string;
  content:         string;
  approvalStatus:  string;
  rejectionReason: string | null;
  createdAt:       string;
  user: { name: string; email: string; department: string | null };
  task: { agentId: string };
}

const STATUS_OPTS = [
  { value: "PENDING",  label: "待批核", color: "var(--amber)" },
  { value: "APPROVED", label: "已批核", color: "var(--green)" },
  { value: "REJECTED", label: "已退回", color: "var(--seal)" },
];

export default function ApprovalsClient() {
  const [docs,        setDocs]        = useState<ApprovalDoc[]>([]);
  const [filter,      setFilter]      = useState("PENDING");
  const [loading,     setLoading]     = useState(true);
  const [expandedId,  setExpandedId]  = useState<string | null>(null);
  const [rejectId,    setRejectId]    = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [acting,      setActing]      = useState(false);

  useEffect(() => { load(); }, [filter]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/approvals?status=${filter}`);
    if (res.ok) setDocs(await res.json());
    setLoading(false);
  }

  async function act(id: string, action: "approve" | "reject", reason?: string) {
    setActing(true);
    const res = await fetch(`/api/approvals/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action, rejectionReason: reason }),
    });
    setActing(false);
    if (res.ok) {
      setRejectId(null);
      setRejectReason("");
      await load();
    } else {
      const j = await res.json();
      alert(j.error ?? "操作失敗");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", fontFamily: "var(--sans)" }}>
      {/* Header */}
      <div style={{ background: "var(--card)", borderBottom: "1px solid var(--border)", padding: "14px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/" style={{ color: "var(--primary)", textDecoration: "none", fontSize: 13 }}>← 返回工作台</Link>
        <span style={{ color: "var(--border)" }}>|</span>
        <h1 style={{ margin: 0, fontSize: 18, fontFamily: "var(--serif)", color: "var(--primary)", fontWeight: 700 }}>文件審批</h1>
        <span style={{ marginLeft: "auto", fontSize: 10, fontFamily: "var(--mono)", color: "var(--seal)", border: "1px solid var(--seal)", padding: "2px 8px", borderRadius: 3 }}>
          APPROVER
        </span>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px" }}>
        {/* Status filter tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {STATUS_OPTS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              style={{
                padding: "6px 16px", borderRadius: 20, fontSize: 12,
                fontFamily: "var(--mono)", cursor: "pointer",
                background: filter === opt.value ? opt.color : "var(--card)",
                color:      filter === opt.value ? "#fff"     : "var(--ink3)",
                border:     `1px solid ${filter === opt.value ? opt.color : "var(--border)"}`,
                fontWeight: filter === opt.value ? 700 : 400,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "var(--ink3)", padding: 40 }}>載入中…</p>
        ) : docs.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--ink3)" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            <p style={{ fontSize: 14 }}>
              {filter === "PENDING" ? "暫無待批核文件" : `無${STATUS_OPTS.find(o => o.value === filter)?.label}文件`}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {docs.map((doc) => (
              <div key={doc.id} style={{
                background: "var(--card)", border: "1px solid var(--border)",
                borderLeft: `4px solid ${doc.approvalStatus === "PENDING" ? "var(--amber)" : doc.approvalStatus === "APPROVED" ? "var(--green)" : "var(--seal)"}`,
                borderRadius: 5, overflow: "hidden",
                boxShadow: "2px 2px 0 var(--primary-light)",
              }}>
                {/* Doc row */}
                <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", fontFamily: "var(--serif)" }}>
                      {doc.title}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink3)", marginTop: 2, fontFamily: "var(--mono)" }}>
                      {doc.docType} · {doc.user.name}（{doc.user.department ?? doc.user.email}）· {new Date(doc.createdAt).toLocaleDateString("zh-HK")}
                    </div>
                  </div>

                  {doc.rejectionReason && (
                    <div style={{ fontSize: 11, color: "var(--seal)", background: "rgba(184,64,48,0.08)", padding: "4px 8px", borderRadius: 3, maxWidth: 200 }}>
                      退回原因：{doc.rejectionReason}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                      onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
                      style={{ background: "none", border: "1px solid var(--border)", borderRadius: 3, padding: "4px 10px", fontSize: 11, cursor: "pointer", color: "var(--ink3)" }}
                    >
                      {expandedId === doc.id ? "▲ 收起" : "▼ 預覽"}
                    </button>
                    {doc.approvalStatus === "PENDING" && (
                      <>
                        <button
                          onClick={() => act(doc.id, "approve")}
                          disabled={acting}
                          style={{ padding: "5px 14px", background: "var(--green)", color: "#fff", border: "none", borderRadius: 3, fontSize: 12, fontWeight: 600, cursor: acting ? "wait" : "pointer", fontFamily: "var(--sans)" }}
                        >
                          ✓ 批核
                        </button>
                        <button
                          onClick={() => { setRejectId(doc.id); setRejectReason(""); }}
                          disabled={acting}
                          style={{ padding: "5px 14px", background: "none", color: "var(--seal)", border: "1px solid var(--seal)", borderRadius: 3, fontSize: 12, fontWeight: 600, cursor: acting ? "wait" : "pointer", fontFamily: "var(--sans)" }}
                        >
                          ✗ 退回
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Content preview */}
                {expandedId === doc.id && (
                  <div style={{
                    borderTop: "1px solid var(--border)", padding: "12px 16px",
                    background: "var(--bg2)", fontFamily: "var(--mono)", fontSize: 12,
                    lineHeight: 1.8, whiteSpace: "pre-wrap", maxHeight: 320, overflowY: "auto",
                  }}>
                    {doc.content}
                  </div>
                )}

                {/* Reject reason input */}
                {rejectId === doc.id && (
                  <div style={{ borderTop: "1px solid var(--border)", padding: "12px 16px", background: "#FFF8ED" }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink3)", marginBottom: 6 }}>
                      退回原因（必填）
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="請說明退回原因…"
                        style={{ flex: 1, border: "1px solid var(--border)", borderRadius: 3, padding: "7px 10px", fontSize: 13, fontFamily: "var(--sans)", background: "var(--card)", color: "var(--ink)" }}
                        onKeyDown={(e) => { if (e.key === "Enter" && rejectReason.trim()) act(doc.id, "reject", rejectReason); }}
                      />
                      <button
                        onClick={() => act(doc.id, "reject", rejectReason)}
                        disabled={!rejectReason.trim() || acting}
                        style={{ padding: "7px 16px", background: "var(--seal)", color: "#fff", border: "none", borderRadius: 3, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--sans)", opacity: !rejectReason.trim() ? 0.5 : 1 }}
                      >
                        確認退回
                      </button>
                      <button
                        onClick={() => setRejectId(null)}
                        style={{ padding: "7px 10px", background: "none", border: "1px solid var(--border)", borderRadius: 3, fontSize: 12, cursor: "pointer", color: "var(--ink3)" }}
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
