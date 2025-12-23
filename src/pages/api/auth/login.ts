import { createSupabaseServerClient } from '../../../lib/supabase';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create server client
    const supabase = createSupabaseServerClient(cookies);
    if (!supabase) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Attempt login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!data.user || !data.session) {
      return new Response(
        JSON.stringify({ error: 'Login failed - no user data or session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Login successful, session created:', !!data.session);
    console.log('Session details:', {
      access_token: !!data.session.access_token,
      refresh_token: !!data.session.refresh_token,
      expires_at: data.session.expires_at
    });

    // Explicitly set the session to ensure cookies are properly set
    if (data.session) {
      const setSessionResult = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      console.log('Session explicitly set, result:', {
        user: !!setSessionResult.data.user,
        session: !!setSessionResult.data.session,
        error: setSessionResult.error?.message
      });

      // Verify the session was set by trying to get it
      const { data: verifySession, error: verifyError } = await supabase.auth.getSession();
      console.log('Session verification:', {
        hasSession: !!verifySession.session,
        hasUser: !!verifySession.session?.user,
        error: verifyError?.message
      });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.warn('Profile fetch error:', profileError);
    }

    const isAdmin = profile?.is_admin === true || email === 'nikhil.as.rajpoot@gmail.com';

    // Store user info in a custom cookie for the admin page to read
    const userInfo = {
      id: data.user.id,
      email: data.user.email,
      isAdmin,
    };

    // Set a custom cookie with user info (in addition to Supabase cookies)
    cookies.set('user_session', JSON.stringify(userInfo), {
      path: '/',
      httpOnly: false, // Allow client-side access
      secure: false, // Allow on localhost
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Return success with user info
    return new Response(
      JSON.stringify({
        success: true,
        user: userInfo,
        redirectTo: isAdmin ? '/admin' : '/dashboard',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (err) {
    console.error('Unexpected login error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};