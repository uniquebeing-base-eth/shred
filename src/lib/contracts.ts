// Live Celo mainnet contract addresses for Shred.
// These are the deployed production contracts. Do NOT change without redeploying.
import type { Address } from "viem";

export const SHRED_PAYMENT_CONTRACT: Address = "0xF01d7D3a57AF16C47bc330c48c5E201cebBf054e";
export const SHRED_REWARDS_CONTRACT: Address = "0x16DD07BD11524de1d904cde7Dfd326c7772C8608";
export const SHRED_BACKEND_SIGNER: Address  = "0xad3e2d50c2d1581D60A2b228001eDEE456637233";

// Celo mainnet tokens
export const CELO_TOKEN: Address = "0x471EcE3750Da237f93B8E339c536989b8978a438";
export const CUSD_TOKEN: Address = "0x765DE816845861e75A25fCA122bb6898B8B1282a";
export const CEUR_TOKEN: Address = "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73";

export const shredRewardsAbi = [
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "distribute",
    inputs: [
      { name: "claimId", type: "bytes32" },
      { name: "player", type: "address" },
      { name: "packKey", type: "uint256" },
      { name: "celoAmount", type: "uint256" },
      { name: "tokens", type: "address[]" },
      { name: "amounts", type: "uint256[]" },
    ],
    outputs: [],
  },
  {
    type: "function",
    stateMutability: "view",
    name: "claimed",
    inputs: [{ name: "", type: "bytes32" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    stateMutability: "view",
    name: "rewarders",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ type: "bool" }],
  },
] as const;

export const erc20Abi = [
  {
    type: "function",
    stateMutability: "view",
    name: "balanceOf",
    inputs: [{ name: "a", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    stateMutability: "view",
    name: "decimals",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
] as const;

// On-chain reward bundles per pack. Amounts are denominated in their token's
// smallest unit factor as a decimal string (parsed with parseUnits at call site).
export const PACK_REWARDS = {
  starter:   { packId: 1n, celo: "0",    tokens: [{ address: CUSD_TOKEN, decimals: 18, amount: "0.01" }] },
  mystery:   { packId: 2n, celo: "0",    tokens: [{ address: CUSD_TOKEN, decimals: 18, amount: "0.05" }] },
  alpha:     { packId: 3n, celo: "0",    tokens: [{ address: CUSD_TOKEN, decimals: 18, amount: "0.10" }] },
  legendary: { packId: 4n, celo: "0.01", tokens: [{ address: CUSD_TOKEN, decimals: 18, amount: "0.25" }] },
} as const;

export type PackKey = keyof typeof PACK_REWARDS;
