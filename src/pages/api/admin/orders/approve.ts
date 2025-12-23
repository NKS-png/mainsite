import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { orderId } = await request.json();

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

    // Update order status to approved
    const { data: order, error } = await supabase
      .from('orders')
      .update({
        status: 'approved',
        description: `[APPROVED] ${currentOrder.description || ''}`,
        service_price: 0, // Will be set when creating actual order
        total: 0
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Order approval error:', error);
      return new Response(JSON.stringify({ error: 'Failed to approve order' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Send approval notification email to customer
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(import.meta.env.RESEND_API_KEY);

      await resend.emails.send({
        from: 'NKScreates <onboarding@resend.dev>',
        to: order.customer_email,
        subject: `Your Project Request Has Been Approved - ${order.service_title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10b981;">🎉 Your Project Request Has Been Approved!</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Project Details:</h3>
              <p><strong>Service:</strong> ${order.service_title}</p>
              <p><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">Approved</span></p>
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>You can now chat with our team for project details</li>
                <li>We'll discuss timeline and pricing</li>
                <li>Project planning will begin shortly</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="/orders" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Your Orders
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              <strong>NKScreates</strong> - Professional Digital Creative Services
            </p>
          </div>
        `
      });

      console.log('Approval email sent successfully');
    } catch (emailError) {
      console.error('Approval email error:', emailError);
      // Don't fail the approval if email fails
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Order approved successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Admin approve order API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};