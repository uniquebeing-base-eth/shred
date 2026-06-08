-- Remove sponsored/campaign features for MVP
DROP TABLE IF EXISTS public.campaigns CASCADE;

-- Add onchain username + smart-wallet linkage to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS username_claimed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS username_tx_hash TEXT,
  ADD COLUMN IF NOT EXISTS minipay_address TEXT;

-- Per-user app-managed Celo wallet (private key encrypted with WALLET_ENCRYPTION_KEY)
CREATE TABLE IF NOT EXISTS public.user_wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL UNIQUE,
  encrypted_private_key TEXT NOT NULL,
  encryption_iv TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.user_wallets TO authenticated;
GRANT ALL ON public.user_wallets TO service_role;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- Users can read only their own wallet metadata; never expose encrypted_private_key client-side via view
CREATE POLICY "Users read own wallet"
  ON public.user_wallets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER user_wallets_updated_at
  BEFORE UPDATE ON public.user_wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();