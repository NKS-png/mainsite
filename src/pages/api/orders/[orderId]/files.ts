import { createSupabaseServerClient } from '../../../../lib/supabase';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, cookies }) => {
  try {
    const supabase = createSupabaseServerClient(cookies);
    if (!supabase) {
      return new Response(JSON.stringify({ error: 'Supabase client not initialized' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const { orderId } = params;

    const { data: files, error } = await supabase
      .from('order_files')
      .select('*')
      .eq('order_id', orderId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching order files:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch order files' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(files), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export const DELETE: APIRoute = async ({ params, request, cookies }) => {
  try {
    const supabase = createSupabaseServerClient(cookies);
    if (!supabase) {
      return new Response(JSON.stringify({ error: 'Supabase client not initialized' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const { orderId } = params;
    const { fileId } = await request.json();

    if (!fileId) {
      return new Response(JSON.stringify({ error: 'File ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // First get the file info
    const { data: file, error: fetchError } = await supabase
      .from('order_files')
      .select('*')
      .eq('id', fileId)
      .eq('order_id', orderId)
      .single();

    if (fetchError || !file) {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('order-files')
      .remove([file.path]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
      // Continue with database delete even if storage delete fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('order_files')
      .delete()
      .eq('id', fileId);

    if (dbError) {
      console.error('Database delete error:', dbError);
      return new Response(JSON.stringify({ error: 'Failed to delete file from database' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}