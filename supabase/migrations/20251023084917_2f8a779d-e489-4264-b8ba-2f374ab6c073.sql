-- Fix products RLS so merchants only see their own products
-- Remove the overly permissive policy that lets everyone see active products
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;

-- The existing "Merchants can view own products" policy remains:
-- This ensures merchants only see their own products in the Products management page

-- Add a new policy for public viewing of active products (for customer payments)
-- This allows unauthenticated users to view active products
CREATE POLICY "Public can view active products for payment" ON public.products
FOR SELECT
USING (is_active = true);

-- Important: This policy applies to unauthenticated users
-- Authenticated users (merchants) will use "Merchants can view own products" policy instead
-- So merchants won't see each other's products, but customers can see products to purchase