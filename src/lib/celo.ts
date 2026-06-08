// Celo chain + onchain helpers (client-side). Username claim goes through
// the user's MiniPay-injected provider. The app's reward wallet is created
// and managed by the backend (see shred-functions.ts).
import { createPublicClient, createWalletClient, custom, http, type Address, type Hex } from "viem";
import { celo } from "viem/chains";

export const CELO_CHAIN = celo;
export const USERNAME_REGISTRY: Address = "0xb1CE5a24ab458a8Fde04e0DF9Bfe86908515c90b";

export const usernameRegistryAbi = [
  { type: "function", stateMutability: "view", name: "isAvailable", inputs: [{ name: "u", type: "string" }], outputs: [{ type: "bool" }] },
  { type: "function", stateMutability: "view", name: "isRegistered", inputs: [{ name: "a", type: "address" }], outputs: [{ type: "bool" }] },
  { type: "function", stateMutability: "view", name: "usernameOf", inputs: [{ name: "a", type: "address" }], outputs: [{ type: "string" }] },
  { type: "function", stateMutability: "nonpayable", name: "registerUser", inputs: [{ name: "u", type: "string" }], outputs: [] },
  { type: "event", name: "UserRegistered", inputs: [
    { indexed: true, name: "user", type: "address" },
    { indexed: false, name: "username", type: "string" },
    { indexed: false, name: "timestamp", type: "uint256" },
  ] },
] as const;

export const publicClient = createPublicClient({ chain: celo, transport: http() });

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  isMiniPay?: boolean;
};

export function getInjectedProvider(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { ethereum?: EthereumProvider };
  return w.ethereum ?? null;
}

export function isMiniPay(): boolean {
  return Boolean(getInjectedProvider()?.isMiniPay);
}

/** Connects to the user's wallet (MiniPay auto-connects). Returns the address. */
export async function connectWallet(): Promise<Address> {
  const provider = getInjectedProvider();
  if (!provider) throw new Error("No wallet detected. Open Shred inside MiniPay.");
  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as Address[];
  if (!accounts?.[0]) throw new Error("Wallet rejected connection.");
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${celo.id.toString(16)}` }],
    });
  } catch {
    // MiniPay is already Celo; ignore.
  }
  return accounts[0];
}

export async function checkUsername(username: string): Promise<{ available: boolean; reason?: string }> {
  if (!/^[a-z0-9_]{3,20}$/i.test(username)) {
    return { available: false, reason: "3–20 chars, letters/numbers/underscore only" };
  }
  const ok = await publicClient.readContract({
    address: USERNAME_REGISTRY,
    abi: usernameRegistryAbi,
    functionName: "isAvailable",
    args: [username],
  });
  return { available: ok, reason: ok ? undefined : "Already taken" };
}

export async function getUsernameForAddress(address: Address): Promise<string | null> {
  try {
    const name = await publicClient.readContract({
      address: USERNAME_REGISTRY,
      abi: usernameRegistryAbi,
      functionName: "usernameOf",
      args: [address],
    });
    return name && name.length > 0 ? name : null;
  } catch {
    return null;
  }
}

/** Submits registerUser() via MiniPay. Returns the tx hash. */
export async function claimUsernameOnchain(username: string, address: Address): Promise<Hex> {
  const provider = getInjectedProvider();
  if (!provider) throw new Error("No wallet detected.");
  const walletClient = createWalletClient({ chain: celo, transport: custom(provider) });
  const hash = await walletClient.writeContract({
    address: USERNAME_REGISTRY,
    abi: usernameRegistryAbi,
    functionName: "registerUser",
    args: [username],
    account: address,
  });
  return hash;
}

export async function waitForTx(hash: Hex) {
  return publicClient.waitForTransactionReceipt({ hash });
}
