-- Add RLS policy to allow public read of merchant profiles
-- This is necessary for CustomerPayment page to display merchant names to unauthenticated customers
CREATE POLICY "Public can view merchant profiles with active products"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.products
    WHERE products.merchant_id = profiles.id
    AND products.is_active = true
  )
);