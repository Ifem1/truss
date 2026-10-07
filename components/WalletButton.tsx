"use client";

import { Check, ChevronDown, Copy, Wallet, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useWallet } from "@/components/WalletProvider";
import { NETWORK } from "@/lib/config";

export default function WalletButton() {
  const { address, chainId, wrongNetwork, busy, error, connect, disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", key); };
  }, [open]);
  useEffect(() => { setOpen(false); }, [address, chainId]);
  useEffect(() => { if (!copied) return; const timer = window.setTimeout(() => setCopied(false), 1500); return () => window.clearTimeout(timer); }, [copied]);
  async function copyAddress() {
    try { await navigator.clipboard.writeText(address); setCopied(true); }
    catch { setCopied(false); }
  }
  function leave() { disconnect(); setOpen(false); }

  return <div className="wallet-wrap" ref={root}>
    {address ? <>
      <button className={`wallet-trigger${wrongNetwork ? " is-wrong" : ""}`} type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(value => !value)}>
        <span className="wallet-dot" aria-hidden="true"/><span className="wallet-identity"><span className="wallet-address">{address.slice(0, 6)}…{address.slice(-4)}</span><small className={wrongNetwork ? "is-wrong" : ""}>{wrongNetwork ? `Wrong network · ${chainId ?? "unknown"}` : "Studionet · 61999"}</small></span><ChevronDown size={14}/>
      </button>
      {open ? <div className="wallet-menu" role="menu" aria-label="Connected wallet">
        <div className="wallet-menu-head"><span className="menu-label">CONNECTED WALLET</span><button className="icon-button menu-close" aria-label="Close wallet menu" onClick={() => setOpen(false)}><X size={16}/></button></div>
        <code className="wallet-full-address">{address}</code>
        <div className={`wallet-network${wrongNetwork ? " is-wrong" : ""}`}><span className="wallet-dot"/>{wrongNetwork ? `Wrong network · ${chainId ?? "unknown"}` : `Studionet · ${NETWORK.chainId}`}</div>
        <button className="wallet-menu-action" role="menuitem" onClick={() => void copyAddress()}>{copied ? <Check size={16}/> : <Copy size={16}/>}<span>{copied ? "Copied" : "Copy address"}</span></button>
        <div className="wallet-menu-divider"/>
        <button className="wallet-menu-action disconnect-action" role="menuitem" onClick={leave}><Wallet size={16}/><span>Disconnect</span></button>
      </div> : null}
    </> : <button className="button connect-button" disabled={busy} onClick={() => void connect()}><Wallet size={15}/>{busy ? "Connecting…" : "Connect wallet"}</button>}
    {error ? <small className="error-text" role="alert">{error}</small> : null}
  </div>;
}
