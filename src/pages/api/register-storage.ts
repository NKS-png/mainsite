import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE;

const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

// POST /api/register-storage
// Body: JSON { bucket, path, filename, mime, size }
export const POST: APIRoute = async ({ request }) => {
  if (!supabaseServiceKey) {
    return new Response(JSON.stringify({ error: 'Server configuration missing' }), { status: 500 });
  }

  try {
    const body = await request.json();
    const { bucket, path, filename, mime, size } = body || {};

    if (!bucket || !path || !filename) {
      return new Response(JSON.stringify({ error: 'bucket, path and filename are required' }), { status: 400 });
    }

    const validBuckets = ['animation', 'artwork', 'video_editing'];
    if (!validBuckets.includes(bucket)) {
      return new Response(JSON.stringify({ error: `Invalid bucket. Allowed: ${validBuckets.join(', ')}` }), { status: 400 });
    }

    // Check if row exists
    const { data: existing, error: selErr } = await supabase.from('uploads').select('id').eq('bucket', bucket).eq('path', path).limit(1);
    if (selErr) {
      console.error('Select error:', selErr);
      return new Response(JSON.stringify({ error: 'DB select error' }), { status: 500 });
    }

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ message: 'Already registered', id: existing[0].id }), { status: 200 });
    }

    const { data, error } = await supabase.from('uploads').insert({
      bucket,
      path,
      filename,
      mime: mime || 'application/octet-stream',
      size: size || 0,
      public: true
    }).select().single();

    if (error) {
      console.error('Insert error:', error);
      return new Response(JSON.stringify({ error: 'DB insert error', details: error }), { status: 500 });
    }

    return new Response(JSON.stringify({ message: 'Registered', file: data }), { status: 200 });
  } catch (err) {
    console.error('Register-storage error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
