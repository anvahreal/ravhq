import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  merchantId: string;
  amount: number;
  customerName: string;
  productId?: string;
  txHash: string;
  blockNumber: number;
  fromAddress: string;
  toAddress: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role to bypass RLS for inserting transactions
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: PaymentRequest = await req.json();

    console.log('Recording payment:', {
      merchantId: payload.merchantId,
      amount: payload.amount,
      txHash: payload.txHash,
    });

    // Validate required fields
    if (!payload.merchantId || !payload.amount || !payload.customerName || !payload.txHash) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate amount
    if (payload.amount <= 0 || payload.amount > 1000000) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate customer name
    if (payload.customerName.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Customer name too long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate reference ID
    const referenceId = `CELO-${Date.now()}-${payload.txHash.slice(0, 8)}`;

    // Insert transaction record
    const { data, error } = await supabase.from('transactions').insert({
      merchant_id: payload.merchantId,
      amount: payload.amount,
      transaction_type: 'credit',
      customer_name: payload.customerName,
      reference_id: referenceId,
      status: 'completed',
      product_id: payload.productId || null,
    }).select().single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to record transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Transaction recorded successfully:', data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        reference_id: referenceId,
        transaction: data 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing payment:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
