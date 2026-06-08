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
    await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          username: data.username,
          display_name: data.username,
          username_claimed_at: new Date().toISOString(),
          username_tx_hash: data.txHash ?? null,
          minipay_address: data.address,
        },
        { onConflict: "id" },
      );

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
