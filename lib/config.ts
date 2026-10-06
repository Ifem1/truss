export const NETWORK = {
  chainId: 61999,
  chainHex: "0xf22f",
  name: "GenLayer Studionet",
  rpc: process.env.NEXT_PUBLIC_GENLAYER_RPC ?? "https://studio.genlayer.com/api",
  explorer: process.env.NEXT_PUBLIC_GENLAYER_EXPLORER ?? "https://explorer-studio.genlayer.com",
  token: { name: "GEN", symbol: "GEN", decimals: 18 }
} as const;
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_TRUSS_CONTRACT_ADDRESS ?? "";
