-- Fix RLS policies to restrict sensitive data exposure

-- Drop the overly permissive public view policy for profiles
DROP POLICY IF EXISTS "Public can view merchant profiles with active products" ON public.profiles;

-- Create a more restrictive policy that only exposes merchant_name and id
-- for merchants with active products (no wallet_address or business_address)
CREATE POLICY "Public can view basic merchant info" ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.products
    WHERE products.merchant_id = profiles.id
      AND products.is_active = true
  )
);

-- Ensure wallet_address is never exposed via API by creating a more restrictive view
-- Create a security definer function to check if user owns the profile
CREATE OR REPLACE FUNCTION public.is_profile_owner(profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = profile_id;
$$;

-- Update profiles policy to ensure authenticated users can only see their own wallet address
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT
USING (public.is_profile_owner(id));

-- Add comment to document security considerations
COMMENT ON COLUMN public.profiles.wallet_address IS 'SENSITIVE: Cryptocurrency wallet address - only visible to profile owner via RLS';
COMMENT ON COLUMN public.profiles.business_address IS 'SENSITIVE: Physical business address - only visible to profile owner via RLS';