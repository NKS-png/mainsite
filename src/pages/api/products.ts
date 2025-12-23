import { createSupabaseServerClient } from '../../lib/supabase';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies }) => {
  const supabase = createSupabaseServerClient(cookies);
  if (!supabase) return new Response(JSON.stringify({ error: 'Supabase client not initialized' }), { status: 500 });
  const { data, error } = await supabase.from('products').select('*');
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient(cookies);
  if (!supabase) return new Response(JSON.stringify({ error: 'Supabase client not initialized' }), { status: 500 });
  const body = await request.json();
  const { name, price, description, category } = body;

  const { data, error } = await supabase.from('products').insert({ name, price, description, category });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { status: 201 });
};