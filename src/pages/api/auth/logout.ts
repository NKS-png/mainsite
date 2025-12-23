import { createSupabaseServerClient } from '../../../lib/supabase';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  try {
    // Create server client
    const supabase = createSupabaseServerClient(cookies);
    if (supabase) {
      // Sign out on server side
      await supabase.auth.signOut();
    }

    // Clear custom user session cookie
    cookies.set('user_session', '', {
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
    });

    // Redirect to home page
    return redirect('/', 302);

  } catch (err) {
    console.error('Logout error:', err);
    // Still redirect even if logout fails
    return redirect('/', 302);
  }
};