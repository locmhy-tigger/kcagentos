"use client";

import { useEffect, useRef, useState } from "react";

interface VoiceButtonProps {
  onResult: (text: string) => void;
  disabled?: boolean;
}

interface SpeechRecognitionResult {
  readonly 0: { transcript: string };
}
interface SpeechRecognitionResultList {
  readonly 0: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent {
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRec {
  lang:            string;
  interimResults:  boolean;
  maxAlternatives: number;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror:  (() => void) | null;
  onend:    (() => void) | null;
  start(): void;
  stop():  void;
}
type SpeechRecCtor = new () => SpeechRec;

function getSR(): SpeechRecCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & { SpeechRecognition?: SpeechRecCtor; webkitSpeechRecognition?: SpeechRecCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function VoiceButton({ onResult, disabled }: VoiceButtonProps) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recRef = useRef<SpeechRec | null>(null);

  useEffect(() => { setSupported(!!getSR()); }, []);

  function toggle() {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const SR = getSR();
    if (!SR) return;
    const rec      = new SR();
    rec.lang            = "zh-HK";
    rec.interimResults  = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript ?? "";
      if (text) onResult(text);
    };
    rec.onerror = () => setListening(false);
    rec.onend   = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      title={listening ? "停止錄音" : "語音輸入（廣東話）"}
      style={{
        padding:      "10px 12px",
        background:   listening ? "var(--seal)" : "var(--card)",
        color:        listening ? "#fff" : "var(--ink3)",
        border:       "1px solid var(--border2)",
        borderRadius: 4,
        fontSize:     18,
        lineHeight:   1,
        cursor:       disabled ? "not-allowed" : "pointer",
        boxShadow:    "2px 2px 0 var(--primary-light)",
        flexShrink:   0,
        alignSelf:    "flex-end",
        transition:   "background 0.15s, color 0.15s",
        opacity:      disabled ? 0.5 : 1,
      }}
      aria-label={listening ? "停止錄音" : "語音輸入"}
    >
      {listening ? "⏹" : "🎙"}
    </button>
  );
}
