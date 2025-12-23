import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

// Create service role client for admin operations
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE;
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

export const prerender = false;

// DELETE /api/uploads/[id] - Delete a specific file
export const DELETE: APIRoute = async ({ params }) => {
  try {
    const id = params.id;

    if (!id) {
      return new Response(JSON.stringify({ error: 'File ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get file info from database
    const { data: fileData, error: fetchError } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !fileData) {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(fileData.bucket)
      .remove([fileData.path]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
      // Continue with DB deletion even if storage deletion fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('uploads')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('Database delete error:', dbError);
      return new Response(JSON.stringify({ error: 'Failed to delete file record' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ message: 'File deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Delete API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};