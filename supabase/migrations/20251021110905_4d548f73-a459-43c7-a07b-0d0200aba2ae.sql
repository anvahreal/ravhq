-- Create products table for merchant catalog
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL CHECK (price > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT products_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Merchants can view their own products
CREATE POLICY "Merchants can view own products"
ON public.products
FOR SELECT
USING (auth.uid() = merchant_id);

-- Merchants can insert their own products
CREATE POLICY "Merchants can insert own products"
ON public.products
FOR INSERT
WITH CHECK (auth.uid() = merchant_id);

-- Merchants can update their own products
CREATE POLICY "Merchants can update own products"
ON public.products
FOR UPDATE
USING (auth.uid() = merchant_id);

-- Merchants can delete their own products
CREATE POLICY "Merchants can delete own products"
ON public.products
FOR DELETE
USING (auth.uid() = merchant_id);

-- Anyone can view active products (for customer payment page)
CREATE POLICY "Anyone can view active products"
ON public.products
FOR SELECT
USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Update transactions table to link to products
ALTER TABLE public.transactions
ADD COLUMN product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;