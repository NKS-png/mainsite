export const prerender = false;
import { supabase } from '../../../lib/supabase';

export async function GET({ params }) {
  const { orderId } = params;
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { status: 200 });
}

export async function PUT({ params, request }) {
  const { orderId } = params;
  const body = await request.json();
  const { status } = body;

  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { status: 200 });
}