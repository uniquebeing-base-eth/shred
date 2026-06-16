// Client-side helper to read live CELO + cUSD balances of a wallet on Celo mainnet.
import { createPublicClient, http, formatUnits, type Address } from "viem";
import { celo } from "viem/chains";
import { CELO_TOKEN, CUSD_TOKEN, erc20Abi } from "@/lib/contracts";

const client = createPublicClient({ chain: celo, transport: http() });

export type WalletBalances = {
  celo: string;   // formatted, 4dp
  cusd: string;   // formatted, 2dp
  celoRaw: bigint;
  cusdRaw: bigint;
};

export async function readWalletBalances(address: Address): Promise<WalletBalances> {
  const [celoBal, cusdBal] = await Promise.all([
    client.getBalance({ address }),
    client.readContract({ address: CUSD_TOKEN, abi: erc20Abi, functionName: "balanceOf", args: [address] }) as Promise<bigint>,
  ]);
  return {
    celoRaw: celoBal,
    cusdRaw: cusdBal,
    celo: Number(formatUnits(celoBal, 18)).toFixed(4),
    cusd: Number(formatUnits(cusdBal, 18)).toFixed(2),
  };
}

export { CELO_TOKEN, CUSD_TOKEN };
