// App-internal server functions for Shred.
// - enterShred: deterministic Supabase sign-in keyed off the user's MiniPay
//   address + claimed username, then ensures profile + backend-managed
//   Celo wallet exist.
// - openShredPack: returns a (mocked) reward bundle for a pack open.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const openPackInput = z.object({
  packKey: z.enum(["starter", "mystery", "alpha", "legendary"]),
});

const enterInput = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
  previewMode: z.boolean().optional(),
});

const swapInput = z.object({
  fromSymbol: z.enum(["CELO", "cUSD", "cEUR", "UBE"]),
  toSymbol: z.enum(["CELO", "cUSD", "cEUR", "UBE"]),
  amountIn: z.string().min(1),
  minAmountOut: z.string().min(1),
  path: z.array(z.string()).min(2),
});

const rewardSets = {
  starter: {
    title: "You Discovered!",
    rewards: [
      { label: "CELO", value: "+0.05", accent: "gold" as const },
      { label: "MENTO", value: "+100", accent: "green" as const },
      { label: "Common MENTO Card", value: "NEW", accent: "violet" as const },
      { label: "Points", value: "+150", accent: "gold" as const },
    ],
  },
  mystery: {
    title: "Rare Pull!",
    rewards: [
      { label: "CELO", value: "+0.08", accent: "gold" as const },
      { label: "UBE", value: "+60", accent: "violet" as const },
      { label: "Rare UBE Card", value: "NEW", accent: "cyan" as const },
      { label: "Points", value: "+240", accent: "gold" as const },
    ],
  },
  alpha: {
    title: "Alpha Rewards!",
    rewards: [
      { label: "CELO", value: "+0.12", accent: "gold" as const },
      { label: "GOOD", value: "+420", accent: "cyan" as const },
      { label: "Epic GOOD Card", value: "NEW", accent: "violet" as const },
      { label: "Points", value: "+420", accent: "gold" as const },
    ],
  },
  legendary: {
    title: "Legendary Pull!",
    rewards: [
      { label: "CELO", value: "+0.20", accent: "gold" as const },
      { label: "MENTO", value: "+500", accent: "green" as const },
      { label: "Legendary MENTO Card", value: "NEW", accent: "gold" as const },
      { label: "Points", value: "+900", accent: "gold" as const },
    ],
  },
} as const;

export const openShredPack = createServerFn({ method: "POST" })
  .inputValidator((data) => openPackInput.parse(data))
  .handler(async ({ data }) => {
    const result = rewardSets[data.packKey];
    return {
      packKey: data.packKey,
      title: result.title,
      rewards: result.rewards,
      claimReady: true,
      claimedAt: null as null,
    };
  });

/**
 * Sign-in entry point after the player claims a username on-chain via MiniPay.
 * Deterministically creates (or reuses) a Supabase user keyed on the wallet
 * address, ensures a profile row stores the username + MiniPay address, and
 * provisions an app-managed Celo wallet for rewards.
 */
export const enterShred = createServerFn({ method: "POST" })
  .inputValidator((data) => enterInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { createShredWallet } = await import("@/lib/wallet.server");
    const { createHmac } = await import("crypto");

    const addr = data.address.toLowerCase();
    const secret = process.env.WALLET_ENCRYPTION_KEY ?? "shred-fallback";
    const email = `${addr}@minipay.shred.local`;
    const password = createHmac("sha256", secret).update(`pw:${addr}`).digest("hex");

    // Try sign-in first.
    let session = await supabaseAdmin.auth.signInWithPassword({ email, password });

    if (session.error || !session.data.session) {
      // Create the user (auto-confirmed via admin).
      const created = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: data.username, minipay_address: data.address },
      });
      if (created.error || !created.data.user) {
        throw new Error(`Sign-in failed: ${session.error?.message ?? created.error?.message ?? "unknown"}`);
      }
      session = await supabaseAdmin.auth.signInWithPassword({ email, password });
      if (session.error || !session.data.session) {
        throw new Error(`Sign-in failed: ${session.error?.message ?? "unknown"}`);
      }
    }

    const userId = session.data.user!.id;

    // Ensure profile row exists with the claimed username + MiniPay address.
    const existingProfile = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    const profileFields = {
      username: data.username,
      display_name: data.username,
      username_claimed_at: new Date().toISOString(),
      username_tx_hash: data.txHash ?? null,
      minipay_address: data.address,
    };

    if (existingProfile.data) {
      await supabaseAdmin.from("profiles").update(profileFields).eq("id", userId);
    } else {
      const cryptoMod = await import("crypto");
      const referralCode = cryptoMod.randomBytes(4).toString("hex").toUpperCase();
      await supabaseAdmin.from("profiles").insert({ id: userId, referral_code: referralCode, ...profileFields });
    }

    // Ensure a backend-managed Shred wallet exists for this user.
    const existing = await supabaseAdmin
      .from("user_wallets")
      .select("address")
      .eq("user_id", userId)
      .maybeSingle();

    let shredAddress = existing.data?.address as string | undefined;
    if (!shredAddress) {
      const w = createShredWallet();
      const ins = await supabaseAdmin.from("user_wallets").insert({
        user_id: userId,
        address: w.address,
        encrypted_private_key: w.encrypted_private_key,
        encryption_iv: w.encryption_iv,
      });
      if (ins.error) throw new Error(`Wallet provisioning failed: ${ins.error.message}`);
      shredAddress = w.address;
    }

    return {
      access_token: session.data.session.access_token,
      refresh_token: session.data.session.refresh_token,
      user_id: userId,
      username: data.username,
      minipay_address: data.address,
      shred_wallet_address: shredAddress,
    };
  });

/**
 * Executes a Ubeswap V2 swap from the user's app-managed Celo wallet.
 * Requires the wallet to hold the input token + a small CELO balance for gas.
 */
export const executeShredSwap = createServerFn({ method: "POST" })
  .inputValidator((data) => swapInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { decryptPrivateKey } = await import("@/lib/wallet.server");
    const { createWalletClient, createPublicClient, http, parseUnits, encodeFunctionData, getAddress } = await import("viem");
    const { privateKeyToAccount } = await import("viem/accounts");
    const { celo } = await import("viem/chains");
    const { getRequestHeader } = await import("@tanstack/react-start/server");

    const token = getRequestHeader("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) throw new Error("Not signed in");
    const userRes = await supabaseAdmin.auth.getUser(token);
    if (userRes.error || !userRes.data.user) throw new Error("Session expired");
    const userId = userRes.data.user.id;

    const w = await supabaseAdmin
      .from("user_wallets")
      .select("address, encrypted_private_key, encryption_iv")
      .eq("user_id", userId)
      .maybeSingle();
    if (!w.data) throw new Error("Wallet not found");

    const TOKENS: Record<string, { address: `0x${string}`; decimals: number }> = {
      CELO: { address: "0x471EcE3750Da237f93B8E339c536989b8978a438", decimals: 18 },
      cUSD: { address: "0x765DE816845861e75A25fCA122bb6898B8B1282a", decimals: 18 },
      cEUR: { address: "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73", decimals: 18 },
      UBE:  { address: "0x71e26d0E519D14591b9dE9a0fE9513A398101490", decimals: 18 },
    };
    const ROUTER = "0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121" as const;

    const pk = decryptPrivateKey(w.data.encrypted_private_key, w.data.encryption_iv);
    const account = privateKeyToAccount(pk);
    const pub = createPublicClient({ chain: celo, transport: http() });
    const wallet = createWalletClient({ chain: celo, transport: http(), account });

    const from = TOKENS[data.fromSymbol];
    const to = TOKENS[data.toSymbol];
    const amountIn = parseUnits(data.amountIn, from.decimals);
    const minOut = parseUnits(data.minAmountOut, to.decimals);
    const path = data.path.map((a) => getAddress(a)) as `0x${string}`[];
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10);

    const bal = (await pub.readContract({
      address: from.address,
      abi: [{ type: "function", stateMutability: "view", name: "balanceOf", inputs: [{ name: "a", type: "address" }], outputs: [{ type: "uint256" }] }],
      functionName: "balanceOf",
      args: [account.address],
    })) as bigint;
    if (bal < amountIn) {
      throw new Error(`Insufficient ${data.fromSymbol} in your Shred wallet (${account.address.slice(0, 8)}…). Fund it from rewards first.`);
    }

    const approveData = encodeFunctionData({
      abi: [{ type: "function", stateMutability: "nonpayable", name: "approve", inputs: [{ name: "s", type: "address" }, { name: "a", type: "uint256" }], outputs: [{ type: "bool" }] }],
      functionName: "approve",
      args: [ROUTER, amountIn],
    });
    const approveHash = await wallet.sendTransaction({ to: from.address, data: approveData });
    await pub.waitForTransactionReceipt({ hash: approveHash });

    const swapData = encodeFunctionData({
      abi: [{
        type: "function", stateMutability: "nonpayable", name: "swapExactTokensForTokens",
        inputs: [
          { name: "amountIn", type: "uint256" }, { name: "amountOutMin", type: "uint256" },
          { name: "path", type: "address[]" }, { name: "to", type: "address" }, { name: "deadline", type: "uint256" },
        ],
        outputs: [{ name: "amounts", type: "uint256[]" }],
      }],
      functionName: "swapExactTokensForTokens",
      args: [amountIn, minOut, path, account.address, deadline],
    });
    const swapHash = await wallet.sendTransaction({ to: ROUTER, data: swapData });
    const rcpt = await pub.waitForTransactionReceipt({ hash: swapHash });
    return { txHash: swapHash, status: rcpt.status, walletAddress: account.address };
  });
