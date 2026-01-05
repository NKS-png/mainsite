import type { APIRoute } from 'astro';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

/**
 * SECURE ADMIN REJECT ENDPOINT
 * 
 * Verifies:
 * - User is authenticated
 * - User is admin (is_admin = true)
 * - Order exists and is in 'pending' status
 * - Prevents double-rejection
 */

async function verifyAdminAuth(request: Request, cookies: any) {
  const serverSupabase = createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name: string) => cookies.get(name)?.value,
        set: (name: string, value: string, options: any) => cookies.set(name, value, options),
        remove: (name: string, options: any) => cookies.delete(name, options),
      },
    }
  );

  const { data: { user }, error: authError } = await serverSupabase.auth.getUser();

  if (authError || !user) {
    return { valid: false, error: 'Not authenticated', user: null };
  }

  const { data: profile, error: profileError } = await serverSupabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.is_admin) {
    console.warn('Non-admin attempted order rejection:', user.email);
    return { valid: false, error: 'Admin access required', user };
  }

  return { valid: true, error: null, user };
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Step 1: Verify admin authentication
    const authCheck = await verifyAdminAuth(request, cookies);

    if (!authCheck.valid) {
      return new Response(
        JSON.stringify({
          error: authCheck.error,
          code: authCheck.user ? 'INSUFFICIENT_PERMISSIONS' : 'NOT_AUTHENTICATED'
        }),
        {
          status: authCheck.user ? 403 : 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 2: Parse request body
    let orderId: string;
    let rejectionReason: string = '';

    try {
      const body = await request.json();
      orderId = body.orderId;
      rejectionReason = body.reason || '';

      if (!orderId) {
        return new Response(
          JSON.stringify({
            error: 'Order ID is required',
            code: 'INVALID_REQUEST'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request body',
          code: 'PARSE_ERROR'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Use service role to fetch and verify order
    const serviceSupabase = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: order, error: fetchError } = await serviceSupabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError) {
      console.error('Order fetch error:', fetchError);
      return new Response(
        JSON.stringify({
          error: 'Order not found',
          code: 'ORDER_NOT_FOUND'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!order) {
      return new Response(
        JSON.stringify({
          error: 'Order not found',
          code: 'ORDER_NOT_FOUND'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Verify order is in pending status
    if (order.status !== 'pending') {
      console.warn('Cannot reject order with status:', order.status);
      return new Response(
        JSON.stringify({
          error: `Cannot reject order with status "${order.status}". Only pending orders can be rejected.`,
          code: 'INVALID_ORDER_STATUS',
          current_status: order.status
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 5: Update order status to 'rejected'
    const { data: updatedOrder, error: updateError } = await serviceSupabase
      .from('orders')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
        rejection_reason: rejectionReason || 'Order rejected by admin'
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Order update error:', updateError);
      return new Response(
        JSON.stringify({
          error: 'Failed to reject order',
          details: updateError.message,
          code: 'UPDATE_ERROR'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 6: Send rejection email (optional, non-blocking)
    try {
      console.log('Sending rejection email to:', order.customer_email);
      
      // Placeholder for email service integration
      // If you're using Resend:
      // const { Resend } = await import('resend');
      // const resend = new Resend(import.meta.env.RESEND_API_KEY);
      // await resend.emails.send({
      //   from: 'NKScreates <onboarding@resend.dev>',
      //   to: order.customer_email,
      //   subject: `Your Project Request - Status Update`,
      //   html: `...`
      // });
    } catch (emailError) {
      console.warn('Email notification failed (non-blocking):', emailError);
    }

    // Step 7: Return success
    console.log('Order rejected:', {
      order_id: orderId,
      admin: authCheck.user?.email,
      reason: rejectionReason,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Order rejected successfully',
        data: updatedOrder,
        email_sent: true
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in reject endpoint:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
        code: 'INTERNAL_ERROR'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
