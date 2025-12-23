import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const supabase = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get all orders since status column doesn't exist
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Orders fetch error:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch orders' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Filter for orders that look like requirements and are not yet approved/rejected
    const pendingOrders = orders.filter(order =>
      (order.order_id?.startsWith('REQ-') ||
       order.description?.toLowerCase().includes('requirement') ||
       !order.total ||
       order.total === 0) &&
      !order.description?.startsWith('[APPROVED]') &&
      !order.description?.startsWith('[REJECTED]')
    );

    return new Response(JSON.stringify(pendingOrders || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Admin orders API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};