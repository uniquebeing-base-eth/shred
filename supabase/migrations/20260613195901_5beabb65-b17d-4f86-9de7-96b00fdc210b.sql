GRANT INSERT ON public.user_wallets TO authenticated;

DROP POLICY IF EXISTS "Users create own wallet" ON public.user_wallets;
CREATE POLICY "Users create own wallet"
  ON public.user_wallets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
