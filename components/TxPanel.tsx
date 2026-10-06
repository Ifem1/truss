import { explorerTx } from "@/lib/genlayer";
export default function TxPanel({hash,phase}:{hash:string;phase:string}){if(!hash&&!phase)return null;const terminal=/failed|rejected|error/i.test(phase);return <div className={`tx ${terminal?"tx-failed":""}`} role="status" aria-live="polite"><b>{phase}</b>{hash?<a href={explorerTx(hash)} target="_blank" rel="noreferrer">{hash} ↗</a>:null}</div>}
