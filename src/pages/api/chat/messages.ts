import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const orderId = url.searchParams.get('orderId');

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

    // Get chat messages for this order
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Chat messages fetch error:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch messages' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(messages || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Chat messages API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};