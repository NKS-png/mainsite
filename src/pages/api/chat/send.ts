import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { orderId, message, senderType } = await request.json();

    if (!orderId || !message || !senderType) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Save chat message
    const { data: chatMessage, error } = await supabase
      .from('chat_messages')
      .insert({
        order_id: orderId,
        message: message,
        sender_type: senderType
      })
      .select()
      .single();

    if (error) {
      console.error('Chat message save error:', error);
      return new Response(JSON.stringify({ error: 'Failed to save message' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // If message is from customer, send notification to admin
    if (senderType === 'customer') {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(import.meta.env.RESEND_API_KEY);

        await resend.emails.send({
          from: 'NKScreates <onboarding@resend.dev>',
          to: 'nikhil.as.rajpoot@gmail.com',
          subject: `New Message from Customer - Order #${orderId}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #007bff;">New Customer Message</h2>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Order ID:</strong> ${orderId}</p>
                <p><strong>Message:</strong></p>
                <div style="background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #007bff;">
                  ${message.replace(/\n/g, '<br>')}
                </div>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="/admin" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View in Admin Panel
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">
                <strong>NKScreates</strong> - Professional Digital Creative Services
              </p>
            </div>
          `
        });

        console.log('Customer message notification sent');
      } catch (emailError) {
        console.error('Customer message notification error:', emailError);
        // Don't fail the message save if email fails
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: chatMessage
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Chat send API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};