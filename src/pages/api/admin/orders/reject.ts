import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { orderId, reason } = await request.json();

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Order ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // First get the current order
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError) {
      console.error('Order fetch error:', fetchError);
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update order status to rejected
    const { data: order, error } = await supabase
      .from('orders')
      .update({
        status: 'rejected',
        description: `[REJECTED${reason ? ` - ${reason}` : ''}] ${currentOrder.description || ''}`,
        service_price: 0,
        total: 0
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Order rejection error:', error);
      return new Response(JSON.stringify({ error: 'Failed to reject order' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Send rejection notification email to customer
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(import.meta.env.RESEND_API_KEY);

      await resend.emails.send({
        from: 'NKScreates <onboarding@resend.dev>',
        to: order.customer_email,
        subject: `Project Request Update - ${order.service_title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #ef4444;">Project Request Update</h2>
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <h3>Regarding: ${order.service_title}</h3>
              <p>After reviewing your project requirements, we regret to inform you that we are unable to proceed with this project at this time.</p>
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
              <p>We appreciate your interest in our services and encourage you to submit other project ideas that might better align with our current capabilities.</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="/services" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Browse Other Services
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              <strong>NKScreates</strong> - Professional Digital Creative Services
            </p>
          </div>
        `
      });

      console.log('Rejection email sent successfully');
    } catch (emailError) {
      console.error('Rejection email error:', emailError);
      // Don't fail the rejection if email fails
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Order rejected'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Admin reject order API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};