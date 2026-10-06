"use client";
import { CONTRACT_ADDRESS } from "@/lib/config";
import { readContract, writeContract } from "@/lib/genlayer";

export type PolicyRecord = { policy_key:string; lineage_key:string; owner:string; software_name:string; repository_owner:string; repository_name:string; usage_context:string; admission_policy:string; criteria:Array<{id:string;title:string;rule:string}>; required_roles:string[]; evidence_authorities:Record<string,Array<{host:string;path_prefix:string}>>; predecessor_policy_key:string; version:number; policy_digest:string };
export type CandidateRecord = { candidate_key:string; policy_key:string; policy_digest:string; lineage_key:string; owner:string; repository_owner:string; repository_name:string; release_label:string; commit_sha:string; predecessor_candidate_key:string; coordinate_digest:string; opened_at:number; status:string; evidence_rounds:Array<{round:number;submitted_at:number;evidence_round_digest:string;evidence:Array<{role:string;url:string}>}>; assessment_attempts:Array<Record<string,any>> };
function parseJson<T>(raw: unknown): T | null { if (typeof raw !== "string" || !raw) return null; try { return JSON.parse(raw) as T; } catch { return null; } }
export async function listPolicyKeys(){ return readContract<string[]>(CONTRACT_ADDRESS,"list_policy_keys"); }
export async function listCandidateKeys(){ return readContract<string[]>(CONTRACT_ADDRESS,"list_candidate_keys"); }
export async function getPolicy(key:string){ return parseJson<PolicyRecord>(await readContract<string>(CONTRACT_ADDRESS,"get_policy_json",[key])); }
export async function getCandidate(key:string){ return parseJson<CandidateRecord>(await readContract<string>(CONTRACT_ADDRESS,"get_candidate_json",[key])); }
export async function getAdmittedHead(lineage:string){ return readContract<string>(CONTRACT_ADDRESS,"get_admitted_head",[lineage]); }
export async function getAdmittedHistory(lineage:string){ const raw=await readContract<string>(CONTRACT_ADDRESS,"get_admitted_history_json",[lineage]); return parseJson<Array<Record<string,unknown>>>(raw)??[]; }
export function createPolicy(a:`0x${string}`,args:unknown[]){ return writeContract(a,CONTRACT_ADDRESS,"create_policy",args); }
export function openCandidate(a:`0x${string}`,args:unknown[]){ return writeContract(a,CONTRACT_ADDRESS,"open_candidate",args); }
export function appendEvidenceRound(a:`0x${string}`,key:string,evidence:string){ return writeContract(a,CONTRACT_ADDRESS,"append_evidence_round",[key,evidence]); }
export function assessCandidate(a:`0x${string}`,key:string){ return writeContract(a,CONTRACT_ADDRESS,"assess_candidate",[key]); }
