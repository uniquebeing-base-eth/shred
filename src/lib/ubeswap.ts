// Ubeswap V2 quote helpers (read-only, run in the browser).
// Router uses Uniswap V2-style getAmountsOut. Execution is delegated to the
// backend (executeShredSwap) which signs from the user's app-managed wallet.
import { createPublicClient, http, parseUnits, formatUnits, type Address } from "viem";
import { celo } from "viem/chains";

export const UBESWAP_V2_ROUTER: Address = "0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121";

export const TOKENS = {
  CELO: { address: "0x471EcE3750Da237f93B8E339c536989b8978a438" as Address, symbol: "CELO", decimals: 18 },
  cUSD: { address: "0x765DE816845861e75A25fCA122bb6898B8B1282a" as Address, symbol: "cUSD", decimals: 18 },
  cEUR: { address: "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73" as Address, symbol: "cEUR", decimals: 18 },
  UBE:  { address: "0x71e26d0E519D14591b9dE9a0fE9513A398101490" as Address, symbol: "UBE",  decimals: 18 },
} as const;

export type TokenKey = keyof typeof TOKENS;

const routerAbi = [
  {
    type: "function",
    stateMutability: "view",
    name: "getAmountsOut",
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "path", type: "address[]" },
    ],
    outputs: [{ name: "amounts", type: "uint256[]" }],
  },
] as const;

const client = createPublicClient({ chain: celo, transport: http() });

export type SwapQuote = {
  amountIn: string;
  amountOut: string;
  minOut: string;
  path: TokenKey[];
  feePct: number;
  priceImpactPct: number;
  slippagePct: number;
  routerDisplay: string;
};

/** Quotes a swap through Ubeswap V2, with optional WCELO hop for non-CELO pairs. */
export async function quoteSwap(
  fromKey: TokenKey,
  toKey: TokenKey,
  amountIn: string,
  slippagePct = 0.5,
): Promise<SwapQuote> {
  const from = TOKENS[fromKey];
  const to = TOKENS[toKey];
  if (fromKey === toKey) throw new Error("Choose two different tokens");
  const amt = parseUnits(amountIn || "0", from.decimals);
  if (amt === 0n) throw new Error("Enter an amount");

  // Try direct path, then route via CELO.
  const tryPaths: TokenKey[][] = fromKey === "CELO" || toKey === "CELO"
    ? [[fromKey, toKey]]
    : [[fromKey, toKey], [fromKey, "CELO", toKey]];

  let last: Error | null = null;
  for (const p of tryPaths) {
    try {
      const amounts = (await client.readContract({
        address: UBESWAP_V2_ROUTER,
        abi: routerAbi,
        functionName: "getAmountsOut",
        args: [amt, p.map((k) => TOKENS[k].address)],
      })) as bigint[];
      const out = amounts[amounts.length - 1];
      const minOutBn = (out * BigInt(Math.floor((100 - slippagePct) * 100))) / 10_000n;
      const feePct = 0.3 * (p.length - 1); // 0.3% per hop
      // Rough price-impact estimate using a single hop reference quote.
      const refQuote = (await client.readContract({
        address: UBESWAP_V2_ROUTER,
        abi: routerAbi,
        functionName: "getAmountsOut",
        args: [parseUnits("1", from.decimals), p.map((k) => TOKENS[k].address)],
      })) as bigint[];
      const expected = (refQuote[refQuote.length - 1] * amt) / parseUnits("1", from.decimals);
      const impact = expected === 0n ? 0 : Math.max(0, Number(((expected - out) * 10_000n) / expected) / 100);
      return {
        amountIn,
        amountOut: formatUnits(out, to.decimals),
        minOut: formatUnits(minOutBn, to.decimals),
        path: p,
        feePct,
        priceImpactPct: impact,
        slippagePct,
        routerDisplay: `${UBESWAP_V2_ROUTER.slice(0, 6)}…${UBESWAP_V2_ROUTER.slice(-4)}`,
      };
    } catch (e) {
      last = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw last ?? new Error("No route found");
}
