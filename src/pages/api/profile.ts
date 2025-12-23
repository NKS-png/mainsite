import { createSupabaseServerClient } from '../../lib/supabase';
import type { APIRoute } from 'astro';

export const PUT: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = createSupabaseServerClient(cookies);
    if (!supabase) {
      return new Response(JSON.stringify({ error: 'Supabase client not initialized' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the authenticated user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const profileData = await request.json();

    // Update profile in database
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: profileData.full_name || profileData.name,
        ...profileData
      })
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return new Response(JSON.stringify({ error: 'Failed to update profile' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Also update auth user metadata
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
      data: { full_name: profileData.full_name || profileData.name }
    });

    if (updateError) {
      console.error('Auth metadata update error:', updateError);
      // Don't fail the whole operation for this error
    }

    return new Response(JSON.stringify({ success: true, profile: data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Profile API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = createSupabaseServerClient(cookies);
    if (!supabase) {
      return new Response(JSON.stringify({ error: 'Supabase client not initialized' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // Get user from localStorage (in a real app, this would come from session/auth)
    const user = JSON.parse(request.headers.get('user') || '{}');

    if (!user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (profileError) {
      console.error('Profile delete error:', profileError);
      return new Response(JSON.stringify({ error: 'Failed to delete profile' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete user uploads
    const { error: uploadsError } = await supabase
      .from('uploads')
      .delete()
      .eq('user_id', user.id);

    if (uploadsError) {
      console.error('Uploads delete error:', uploadsError);
      // Don't fail the whole operation for uploads error
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Profile delete API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};