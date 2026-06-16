
-- Lock down sensitive wallet columns: only service_role can read encrypted private key material.
REVOKE SELECT (encrypted_private_key, encryption_iv) ON public.user_wallets FROM authenticated;
REVOKE SELECT (encrypted_private_key, encryption_iv) ON public.user_wallets FROM anon;

-- Remove client-side write capability on user_cards (server-only minting via service role).
DROP POLICY IF EXISTS "Users can create their own cards" ON public.user_cards;
DROP POLICY IF EXISTS "Users can update their own cards" ON public.user_cards;
DROP POLICY IF EXISTS "Users can delete their own cards" ON public.user_cards;
REVOKE INSERT, UPDATE, DELETE ON public.user_cards FROM authenticated;

-- Remove client-side write capability on user_token_balances (server-only credits).
DROP POLICY IF EXISTS "Users can create their own token balances" ON public.user_token_balances;
DROP POLICY IF EXISTS "Users can update their own token balances" ON public.user_token_balances;
DROP POLICY IF EXISTS "Users can delete their own token balances" ON public.user_token_balances;
REVOKE INSERT, UPDATE, DELETE ON public.user_token_balances FROM authenticated;
