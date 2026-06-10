"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const params = useSearchParams();
  const error = params.get("error");

  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--bg)", fontFamily: "var(--sans)" }}
    >
      {/* 巨型水印 */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
        aria-hidden
      >
        <span
          style={{
            fontFamily: "var(--serif)",
            fontSize: "28vw",
            color: "var(--primary)",
            opacity: 0.04,
            lineHeight: 1,
          }}
        >
          基智
        </span>
      </div>

      <div
        className="relative z-10 flex flex-col items-center gap-8"
        style={{ maxWidth: 400, width: "100%", padding: "0 24px" }}
      >
        {/* 印章 Logo */}
        <div className="flex flex-col items-center gap-3">
          <div
            style={{
              width: 72,
              height: 72,
              background: "var(--seal)",
              color: "#fff",
              fontFamily: "var(--serif)",
              fontSize: 36,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "3px 3px 0 var(--primary-light)",
            }}
          >
            智
          </div>
          <div className="text-center">
            <h1
              style={{
                fontFamily: "var(--serif)",
                fontSize: 22,
                fontWeight: 700,
                color: "var(--ink)",
                margin: 0,
              }}
            >
              基智 Agent OS
            </h1>
            <p style={{ color: "var(--ink3)", fontSize: 13, marginTop: 4, fontFamily: "var(--mono)" }}>
              KCSS · 教師智能工作台
            </p>
          </div>
        </div>

        {/* 登入卡 */}
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            boxShadow: "3px 3px 0 var(--primary-light)",
            borderRadius: 6,
            padding: "32px 28px",
            width: "100%",
          }}
        >
          {error === "domain" && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                borderRadius: 4,
                padding: "10px 14px",
                marginBottom: 20,
                color: "var(--seal)",
                fontSize: 13,
              }}
            >
              只限 @gs.keichi.edu.hk 帳號登入。請使用學校 Google 帳號。
            </div>
          )}
          {error && error !== "domain" && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                borderRadius: 4,
                padding: "10px 14px",
                marginBottom: 20,
                color: "var(--seal)",
                fontSize: 13,
              }}
            >
              登入失敗，請再試。
            </div>
          )}

          <p style={{ color: "var(--ink2)", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            請以學校 Google 帳號登入。系統只接受 <strong>@gs.keichi.edu.hk</strong> 帳號。
          </p>

          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            style={{
              width: "100%",
              padding: "12px 20px",
              background: "var(--primary)",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--sans)",
              boxShadow: "2px 2px 0 var(--primary-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            以學校 Google 帳號登入
          </button>
        </div>

        <p style={{ color: "var(--ink3)", fontSize: 12, textAlign: "center" }}>
          © 2025 基督教香港崇真會基智中學 · 教師 Agent OS
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
