"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

export default function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);
  async function copy() {
    try { await navigator.clipboard.writeText(value); setCopied(true); }
    catch { setCopied(false); }
  }
  return <button className={`copy-button${copied ? " copied" : ""}`} type="button" onClick={() => void copy()} aria-label={copied ? "Copied" : `${label} to clipboard`} title={copied ? "Copied" : label}>
    {copied ? <Check size={14} aria-hidden="true"/> : <Copy size={14} aria-hidden="true"/>}<span>{copied ? "Copied" : label}</span>
  </button>;
}
