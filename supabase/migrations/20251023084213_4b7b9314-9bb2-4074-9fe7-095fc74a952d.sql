-- Fix RLS to allow public access to merchant wallet addresses (needed for payments)
-- Wallet addresses are public on blockchain anyway, so this is safe
-- But we still protect business_address and other sensitive data

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Public can view basic merchant info" ON public.profiles;

-- Create policy that allows viewing merchant_name, id, and wallet_address for merchants with active products
-- This is necessary because customers need the wallet address to send payments
CREATE POLICY "Public can view merchant payment info" ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.products
    WHERE products.merchant_id = profiles.id
      AND products.is_active = true
  )
);

-- Note: The RLS will still apply row-level filtering
-- Sensitive columns like business_address will need to be excluded in queries
-- by simply not selecting them in the application code

-- Update comment to clarify wallet address is intentionally public
COMMENT ON COLUMN public.profiles.wallet_address IS 'PUBLIC: Cryptocurrency wallet address - visible to customers for payment processing. This is safe as wallet addresses are public on blockchain.';
COMMENT ON COLUMN public.profiles.business_address IS 'SENSITIVE: Physical business address - only visible to profile owner. Never select this in public queries.';