-- Add wallet_address column to profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'wallet_address'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN wallet_address text;
  END IF;
END $$;

-- Add index for wallet_address lookups
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_address ON public.profiles(wallet_address);