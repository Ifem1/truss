"use client";
import { createContext,useCallback,useContext,useEffect,useMemo,useState } from "react";
import { connectInjected,currentChainId,provider } from "@/lib/genlayer";
import { NETWORK } from "@/lib/config";
type V={address:`0x${string}`|"";chainId:number|null;wrongNetwork:boolean;busy:boolean;error:string;connect():Promise<void>;disconnect():void};
const C=createContext<V|null>(null);
export function WalletProvider({children}:{children:React.ReactNode}){
 const[address,setAddress]=useState<`0x${string}`|"">("");const[chainId,setChainId]=useState<number|null>(null);const[busy,setBusy]=useState(false);const[error,setError]=useState("");
 const sync=useCallback(async()=>{const p=provider();if(!p){setAddress("");setChainId(null);return}try{const a=await p.request({method:"eth_accounts"}) as string[];setAddress((a?.[0] as `0x${string}`|undefined)??"");setChainId(await currentChainId(p))}catch{setAddress("");setChainId(null)}},[]);
 useEffect(()=>{const p=provider();if(!p)return;void sync();const accounts=()=>void sync();const chain=()=>void sync();p.on?.("accountsChanged",accounts);p.on?.("chainChanged",chain);return()=>{p.removeListener?.("accountsChanged",accounts);p.removeListener?.("chainChanged",chain)}},[sync]);
 const connect=useCallback(async()=>{setBusy(true);setError("");try{setAddress(await connectInjected());await sync()}catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}},[sync]);
 const disconnect=useCallback(()=>{setAddress("");setError("")},[]);const wrongNetwork=Boolean(address&&chainId!==NETWORK.chainId);const value=useMemo(()=>({address,chainId,wrongNetwork,busy,error,connect,disconnect}),[address,chainId,wrongNetwork,busy,error,connect,disconnect]);return <C.Provider value={value}>{children}</C.Provider>
}
export function useWallet(){const v=useContext(C);if(!v)throw new Error("useWallet must be used inside WalletProvider");return v}
