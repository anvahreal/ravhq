import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ReceiptData {
  customerName: string
  customerEmail?: string
  merchantName: string
  merchantEmail: string
  productName: string
  quantity: number
  unitPrice: number
  totalAmount: number
  txHash: string
  network: string
  referenceId: string
  paymentDate: string
}

const generateReceiptHTML = (data: ReceiptData, isCustomer: boolean) => {
  const recipient = isCustomer ? data.customerName : data.merchantName
  const greeting = isCustomer ? "Thank you for your purchase!" : "You received a payment!"
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%); padding: 40px 30px; text-align: center;">
              <img src="https://your-domain.com/logo.png" alt="RAV Logo" style="width: 120px; height: auto; margin-bottom: 20px;" />
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Payment Receipt</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${greeting}</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- Recipient Greeting -->
              <p style="color: #1f2937; font-size: 16px; margin: 0 0 30px 0;">
                Hi ${recipient},
              </p>

              <!-- Payment Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <h2 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 20px 0;">Payment Details</h2>
                    
                    <table width="100%" cellpadding="8" cellspacing="0">
                      ${isCustomer ? `
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 8px 0;">Merchant:</td>
                        <td style="color: #1f2937; font-size: 14px; font-weight: 600; text-align: right; padding: 8px 0;">${data.merchantName}</td>
                      </tr>
                      ` : `
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 8px 0;">Customer:</td>
                        <td style="color: #1f2937; font-size: 14px; font-weight: 600; text-align: right; padding: 8px 0;">${data.customerName}</td>
                      </tr>
                      `}
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 8px 0;">Product/Service:</td>
                        <td style="color: #1f2937; font-size: 14px; font-weight: 600; text-align: right; padding: 8px 0;">${data.productName}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 8px 0;">Quantity:</td>
                        <td style="color: #1f2937; font-size: 14px; font-weight: 600; text-align: right; padding: 8px 0;">${data.quantity}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding: 8px 0;">Unit Price:</td>
                        <td style="color: #1f2937; font-size: 14px; font-weight: 600; text-align: right; padding: 8px 0;">$${data.unitPrice.toFixed(2)}</td>
                      </tr>
                      <tr style="border-top: 2px solid #e5e7eb;">
                        <td style="color: #1f2937; font-size: 18px; font-weight: 700; padding: 16px 0 8px 0;">Total Amount:</td>
                        <td style="color: #06b6d4; font-size: 24px; font-weight: 700; text-align: right; padding: 16px 0 8px 0;">$${data.totalAmount.toFixed(2)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Transaction Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-left: 4px solid #06b6d4; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                <tr>
                  <td>
                    <h3 style="color: #1e40af; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">🔒 Blockchain Transaction</h3>
                    <table width="100%" cellpadding="4" cellspacing="0">
                      <tr>
                        <td style="color: #1e40af; font-size: 13px;">Reference ID:</td>
                        <td style="color: #1e3a8a; font-size: 13px; font-weight: 600; text-align: right;">${data.referenceId}</td>
                      </tr>
                      <tr>
                        <td style="color: #1e40af; font-size: 13px;">Network:</td>
                        <td style="color: #1e3a8a; font-size: 13px; font-weight: 600; text-align: right;">${data.network === 'celo' ? 'Celo' : 'Base'} Testnet</td>
                      </tr>
                      <tr>
                        <td style="color: #1e40af; font-size: 13px;">Date:</td>
                        <td style="color: #1e3a8a; font-size: 13px; font-weight: 600; text-align: right;">${data.paymentDate}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top: 12px;">
                          <a href="${data.network === 'celo' ? 'https://celo-sepolia.blockscout.com' : 'https://sepolia.basescan.org'}/tx/${data.txHash}" 
                             style="display: inline-block; background-color: #06b6d4; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 600;">
                            View on Blockchain Explorer →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Footer Message -->
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                ${isCustomer 
                  ? 'This payment was processed securely on the blockchain. Your transaction is immutable and publicly verifiable.'
                  : 'The funds have been sent to your connected wallet. You can verify the transaction on the blockchain explorer.'
                }
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 13px; margin: 0 0 10px 0;">
                Questions? Contact support at support@ravpay.com
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} RAV Payment System. All rights reserved.
              </p>
              <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">
                Powered by blockchain technology • Instant settlement • Low fees
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const data: ReceiptData = await req.json()

    // Send email to merchant (always)
    const merchantEmailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'RAV Payments <payments@yourdomain.com>',
        to: data.merchantEmail,
        subject: `💰 Payment Received - $${data.totalAmount.toFixed(2)}`,
        html: generateReceiptHTML(data, false),
      }),
    })

    const merchantResult = await merchantEmailResponse.json()

    // Send email to customer (if email provided)
    let customerResult = null
    if (data.customerEmail) {
      const customerEmailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'RAV Payments <receipts@yourdomain.com>',
          to: data.customerEmail,
          subject: `Receipt for your purchase - $${data.totalAmount.toFixed(2)}`,
          html: generateReceiptHTML(data, true),
        }),
      })

      customerResult = await customerEmailResponse.json()
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        merchantEmail: merchantResult,
        customerEmail: customerResult 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Email error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})