import type { APIRoute } from 'astro';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

/**
 * SECURE ADMIN STATS ENDPOINT
 * 
 * Returns aggregated order statistics:
 * - Total orders
 * - Pending orders
 * - Completed orders
 * - Total revenue
 * 
 * With explicit error handling and admin verification
 */

async function verifyAdminAuth(request: Request, cookies: any) {
  const serverSupabase = createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name: string) => cookies.get(name)?.value,
        set: (name: string, value: string, options: any) => cookies.set(name, value, options),
        remove: (name: string, options: any) => cookies.delete(name, options),
      },
    }
  );

  const { data: { user }, error: authError } = await serverSupabase.auth.getUser();

  if (authError || !user) {
    return { valid: false, error: 'Not authenticated', user: null };
  }

  const { data: profile, error: profileError } = await serverSupabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.is_admin) {
    return { valid: false, error: 'Admin access required', user };
  }

  return { valid: true, error: null, user };
}

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Step 1: Verify admin authentication
    const authCheck = await verifyAdminAuth(request, cookies);

    if (!authCheck.valid) {
      return new Response(
        JSON.stringify({
          error: authCheck.error,
          code: authCheck.user ? 'INSUFFICIENT_PERMISSIONS' : 'NOT_AUTHENTICATED',
          stats: {
            total_orders: 0,
            pending_orders: 0,
            completed_orders: 0,
            total_revenue: 0
          }
        }),
        {
          status: authCheck.user ? 403 : 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 2: Use service role to fetch order statistics
    const serviceSupabase = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch all orders (we'll aggregate client-side for flexibility)
    const { data: allOrders, error: ordersError } = await serviceSupabase
      .from('orders')
      .select('id, status, total')
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Orders stats query error:', ordersError);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch order statistics',
          details: ordersError.message,
          code: 'QUERY_ERROR',
          stats: {
            total_orders: 0,
            pending_orders: 0,
            completed_orders: 0,
            total_revenue: 0
          }
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Compute statistics from results
    const orders = allOrders || [];
    const stats = {
      total_orders: orders.length,
      pending_orders: orders.filter(o => o.status === 'pending').length,
      accepted_orders: orders.filter(o => o.status === 'accepted').length,
      completed_orders: orders.filter(o => o.status === 'completed').length,
      rejected_orders: orders.filter(o => o.status === 'rejected').length,
      total_revenue: orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)
    };

    // Step 4: Return success
    console.log('Admin stats retrieved:', {
      admin: authCheck.user?.email,
      stats,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: stats,
        meta: {
          admin_email: authCheck.user?.email,
          queried_at: new Date().toISOString()
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in stats endpoint:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
        code: 'INTERNAL_ERROR',
        stats: {
          total_orders: 0,
          pending_orders: 0,
          completed_orders: 0,
          total_revenue: 0
        }
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
