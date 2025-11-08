import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      email, 
      name, 
      orderDetails,
      productType,
      invoicePdfUrl 
    } = await req.json();

    if (!email || !orderDetails) {
      throw new Error("Email and order details are required");
    }

    const { amount, currency, items, sessionId } = orderDetails;
    const formattedAmount = (amount / 100).toFixed(2);
    const currencySymbol = currency === 'usd' ? '$' : currency.toUpperCase();

    // Build items HTML
    const itemsHtml = items?.map((item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          ${item.description}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
          ${currencySymbol}${((item.amount_total || 0) / 100).toFixed(2)}
        </td>
      </tr>
    `).join('') || '';

    const productTypeName = productType === 'subscription_monthly' ? 'Monthly Subscription' :
                           productType === 'subscription_annual' ? 'Annual Subscription' :
                           'Credits Purchase';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Thank You for Your Purchase! 🎉</h1>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; margin-bottom: 24px;">
              Hi ${name || 'there'},
            </p>
            
            <p style="font-size: 16px; margin-bottom: 24px;">
              Your payment has been successfully processed! Here's a summary of your order:
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #667eea;">Order Summary</h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                ${itemsHtml}
                <tr>
                  <td style="padding: 16px 12px 12px; font-weight: bold; font-size: 18px;">
                    Total
                  </td>
                  <td style="padding: 16px 12px 12px; text-align: right; font-weight: bold; font-size: 18px; color: #667eea;">
                    ${currencySymbol}${formattedAmount}
                  </td>
                </tr>
              </table>
              
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e0e0e0;">
                <p style="margin: 4px 0; color: #666; font-size: 14px;">
                  <strong>Product Type:</strong> ${productTypeName}
                </p>
                <p style="margin: 4px 0; color: #666; font-size: 14px;">
                  <strong>Order ID:</strong> ${sessionId}
                </p>
                <p style="margin: 4px 0; color: #666; font-size: 14px;">
                  <strong>Payment Status:</strong> <span style="color: #10b981;">✓ Paid</span>
                </p>
              </div>
            </div>
            
            <div style="background: #e0f2fe; border-left: 4px solid #0ea5e9; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #0c4a6e;">
                <strong>💡 What's Next?</strong><br>
                Your account has been updated with your new plan. Log in to start enjoying your benefits!
              </p>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-bottom: 24px;">
              If you have any questions about your order, please don't hesitate to reach out to our support team.
            </p>
            
            ${invoicePdfUrl ? `
            <div style="background: #f0fdf4; border: 1px solid #86efac; padding: 16px; margin-bottom: 24px; border-radius: 8px; text-align: center;">
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #166534;">
                📄 <strong>Your official Stripe invoice is ready!</strong>
              </p>
              <a href="${invoicePdfUrl}" 
                 style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
                Download Invoice PDF
              </a>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin-top: 32px;">
              <a href="${Deno.env.get('FRONTEND_URL') || 'http://localhost:3000'}" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Go to Dashboard
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 32px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
              © ${new Date().getFullYear()} Trading Diary. All rights reserved.<br>
              This is an automated confirmation email. Please do not reply to this message.
            </p>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: "Trading Diary <onboarding@resend.dev>",
      to: [email],
      subject: `Order Confirmation - ${productTypeName}`,
      html: emailHtml,
    });

    if (error) {
      throw error;
    }

    console.log("Confirmation email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, emailId: data?.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
