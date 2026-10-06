"use client";
import { createClient } from "genlayer-js";
import { TransactionHashVariant } from "genlayer-js/types";
import { studionet } from "genlayer-js/chains";
import { NETWORK } from "@/lib/config";

export type InjectedProvider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  providers?: InjectedProvider[];
};
declare global { interface Window { ethereum?: InjectedProvider; } }

export function provider(): InjectedProvider | undefined {
  if (typeof window === "undefined") return undefined;
  const injected = window.ethereum;
  return injected?.providers?.[0] ?? injected;
}

export async function currentChainId(p = provider()): Promise<number | null> {
  if (!p) return null;
  const raw = await p.request({ method: "eth_chainId" });
  const parsed = Number.parseInt(String(raw), 16);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function ensureStudionet() {
  const p = provider();
  if (!p) throw new Error("No injected EIP-1193 wallet detected.");
  if (await currentChainId(p) === NETWORK.chainId) return;
  try {
    await p.request({ method: "wallet_switchEthereumChain", params: [{ chainId: NETWORK.chainHex }] });
  } catch (error) {
    if ((error as { code?: number }).code !== 4902) throw error;
    await p.request({ method: "wallet_addEthereumChain", params: [{ chainId: NETWORK.chainHex, chainName: NETWORK.name, nativeCurrency: NETWORK.token, rpcUrls: [NETWORK.rpc], blockExplorerUrls: [NETWORK.explorer] }] });
    await p.request({ method: "wallet_switchEthereumChain", params: [{ chainId: NETWORK.chainHex }] });
  }
  if (await currentChainId(p) !== NETWORK.chainId) throw new Error("TRUSS requires Studionet chain 61999.");
}

export async function connectInjected(): Promise<`0x${string}`> {
  const p = provider();
  if (!p) throw new Error("No injected EIP-1193 wallet detected.");
  await ensureStudionet();
  const accounts = await p.request({ method: "eth_requestAccounts" }) as string[];
  const address = accounts?.[0] as `0x${string}` | undefined;
  if (!address) throw new Error("Wallet returned no account.");
  return address;
}

export function readClient() { return createClient({ chain: studionet, endpoint: NETWORK.rpc }); }
export function walletClient(address: `0x${string}`) {
  const p = provider();
  if (!p) throw new Error("No injected wallet detected.");
  return createClient({ chain: studionet, account: address, provider: p as never });
}

export async function readContract<T>(address: string, functionName: string, args: unknown[] = []) {
  if (!address) throw new Error("TRUSS contract address is not configured.");
  return readClient().readContract({ address: address as `0x${string}`, functionName, args, transactionHashVariant: TransactionHashVariant.LATEST_FINAL } as never) as Promise<T>;
}

export async function writeContract(account: `0x${string}`, address: string, functionName: string, args: unknown[] = []) {
  if (!address) throw new Error("TRUSS contract address is not configured.");
  await ensureStudionet();
  if (await currentChainId() !== NETWORK.chainId) throw new Error("Wrong network. No transaction was signed.");
  const active = await provider()?.request({ method: "eth_accounts" }) as string[] | undefined;
  if (!active?.some((x) => x.toLowerCase() === account.toLowerCase())) throw new Error("Wallet account changed. Reconnect before signing.");
  return walletClient(account).writeContract({ address: address as `0x${string}`, functionName, args, value: 0n } as never) as Promise<`0x${string}`>;
}

export async function waitFinalized(hash: `0x${string}`) {
  const receipt = await readClient().waitForTransactionReceipt({ hash: hash as never, status: "FINALIZED", retries: 360, interval: 5000 } as never);
  if (receipt.statusName !== "FINALIZED" && receipt.status !== 7) throw new Error("Transaction did not reach FINALIZED state.");
  if (receipt.txExecutionResultName !== "FINISHED_WITH_RETURN") throw new Error(`Transaction finalized without a successful execution (${receipt.txExecutionResultName ?? "unknown result"}).`);
  return receipt;
}

export function explorerTx(hash: string) { return `${NETWORK.explorer}/tx/${hash}`; }
