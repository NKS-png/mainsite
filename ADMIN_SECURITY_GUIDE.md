# Admin Dashboard Security & Reliability Guide

## Executive Summary

Your current admin page has several **security gaps and silent data failures**. This guide fixes:

1. **Auth bypass risk** - Client-side auth checks can be spoofed
2. **Silent Supabase failures** - Queries return empty arrays without errors
3. **RLS conflicts** - Admin queries blocked by user-scoped policies
4. **Missing data validation** - No explicit error handling
5. **Hardcoded admin emails** - No scalable admin system

---

## Problem Analysis

### Current Issues

| Issue | Impact | Severity |
|-------|--------|----------|
| Server-side admin check exists but vulnerable | Can bypass if API endpoints not protected | **HIGH** |
| Frontend uses `/api/admin/orders` without auth verification in endpoint | Any authenticated user could call admin API | **CRITICAL** |
| RLS policies block admin reads to pending orders | Admin sees empty arrays silently | **HIGH** |
| No error propagation from API → UI | UI shows "0 orders" instead of error message | **HIGH** |
| `status` column filtering unreliable | Uses description string parsing + REQ- prefix | **MEDIUM** |
| Hardcoded email list not scalable | Can't grant admin to others without code change | **LOW** |

### Root Causes

1. **Auth happens server-side (good), but API endpoints don't verify**
   - Page redirects non-admins ✅
   - But if they somehow get auth cookies, `/api/admin/orders` will serve them

2. **RLS policies conflict with admin role**
   - `"Admin view all orders"` policy checks `is_admin = true` in profiles
   - But your database might have stale/missing admin records
   - Or RLS is evaluating before service role kicks in

3. **Silent failures in API design**
   ```typescript
   // Current: Returns [] instead of error
   const { data, error } = await supabase.from('orders').select('*');
   if (error) return error;  // ← But if RLS blocks, error is NULL and data is []
   return data || [];
   ```

4. **Status filtering is string-based**
   ```typescript
   // Current: Brittle logic
   const pendingOrders = orders.filter(order =>
     (order.order_id?.startsWith('REQ-') ||
      order.description?.toLowerCase().includes('requirement')) &&
     !order.description?.startsWith('[APPROVED]')
   );
   ```
   **Problem:** If you save `[APPROVED]` with uppercase, filtering might fail

---

## Solution Architecture

### Auth Layer

```
┌─────────────────────────────────────────┐
│ User visits /admin                      │
└──────────────────┬──────────────────────┘
                   │
      ┌────────────┴────────────┐
      │  Server-Side Check      │
      │  (admin.astro)          │
      │  1. Auth verified?      │
      │  2. Has is_admin=true?  │
      └────────────┬────────────┘
                   │
      ┌────────────┴────────────┐
      │ Render Admin Page        │
      │ + Pass Session Token     │
      └─────────────────────────┘
      
      ↓ User clicks "Load Orders"
      
      ┌──────────────────────────┐
      │ GET /api/admin/orders    │
      │ (with auth cookies)      │
      └────────┬─────────────────┘
               │
      ┌────────┴──────────────┐
      │ API Endpoint Checks   │
      │ 1. User authenticated?│
      │ 2. User is_admin?     │
      │ 3. No RLS bypass      │
      └────────┬──────────────┘
               │
      ┌────────┴────────────────┐
      │ Supabase Service Role   │
      │ (bypass RLS, get data)  │
      └────────┬─────────────────┘
               │
      ┌────────┴────────────────┐
      │ Return Data + Errors    │
      │ (never silent failures) │
      └─────────────────────────┘
```

### Key Decisions

#### 1. Admin Determination Method: **is_admin flag in profiles table**

**Why:**
- Email-based is brittle (what if you change email?)
- Role-based flag is scalable (can grant to team later)
- Stored in DB, not just hardcoded

**Backup:** Keep email check as secondary for immediate access

#### 2. All sensitive logic MUST be server-side

- Auth checks ✅ (in admin.astro)
- Permission checks ✅ (in API endpoints)
- Admin queries ✅ (use service role)
- Data validation ✅ (no raw user input)

#### 3. RLS Strategy: **Dual path approach**

**For admin:**
- Use **service role** in API endpoints (bypasses RLS)
- Never expose service role to frontend
- Verify admin status BEFORE using service role

**For regular users:**
- Use **anon key** in browser (RLS enforces security)
- Can only see own data (RLS blocks others)

#### 4. Error Handling: **Explicit > Silent**

```typescript
// ✅ Good
if (error) {
  console.error('RLS block or DB error:', error);
  return new Response(
    JSON.stringify({ error: 'Failed to load orders', details: error.message }),
    { status: 500 }
  );
}

// ❌ Bad (current)
return data || [];  // Empty array hides errors
```

---

## Implementation: Admin Auth Flow

### Step 1: Verify is_admin Flag in admin.astro (Server-Side)

```typescript
// admin.astro frontmatter
---
import { createSupabaseServerClient } from '../lib/supabase';

const serverSupabase = createSupabaseServerClient(Astro.cookies);

// 1. Get authenticated user
const { data: { user }, error: authError } = await serverSupabase.auth.getUser();
if (authError || !user) {
  return Astro.redirect('/login?error=not_authenticated');
}

// 2. Check is_admin flag from database
const { data: profile, error: profileError } = await serverSupabase
  .from('profiles')
  .select('is_admin')
  .eq('id', user.id)
  .single();

if (profileError || !profile?.is_admin) {
  console.error('Admin access denied:', user.email);
  return Astro.redirect('/?error=admin_required');
}

// 3. Safe to render admin page
console.log('✅ Admin verified:', user.email);
---
```

### Step 2: Protect API Endpoints

```typescript
// src/pages/api/admin/orders.ts
import { createClient } from '@supabase/supabase-js';
import type { APIRoute } from 'astro';

function validateAdminRequest(request: Request, user: any) {
  // Verify authenticated
  if (!user) {
    return { valid: false, error: 'Not authenticated', status: 401 };
  }

  // Verify has auth cookie (optional extra check)
  const authHeader = request.headers.get('cookie');
  if (!authHeader?.includes('sb-access-token')) {
    return { valid: false, error: 'Missing auth cookie', status: 401 };
  }

  return { valid: true };
}

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Create server client from request cookies
    const serverSupabase = createServerClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get: (name) => cookies.get(name)?.value,
          set: (name, value, options) => cookies.set(name, value, options),
          remove: (name, options) => cookies.delete(name, options),
        },
      }
    );

    // 2. Verify user is authenticated
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Verify user is admin
    const { data: profile, error: profileError } = await serverSupabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile lookup error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify admin status' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!profile?.is_admin) {
      console.warn('Non-admin user attempted admin access:', user.email);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Now use service role for admin query (bypasses RLS)
    const serviceSupabase = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 5. Fetch orders with proper error handling
    const { data: orders, error } = await serviceSupabase
      .from('orders')
      .select('*')
      .eq('status', 'pending')  // Only pending
      .order('created_at', { ascending: false });

    // 6. Explicit error handling (no silent failures)
    if (error) {
      console.error('Supabase query error:', error);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch orders',
          details: error.message,
          code: error.code
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 7. Return data (or empty array if no orders)
    return new Response(
      JSON.stringify({
        success: true,
        data: orders || [],
        count: orders?.length || 0
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in admin orders API:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

---

## Supabase Query Patterns for Admin

### Pattern 1: Query specific status

```typescript
// ✅ Good: Explicit status check
const { data, error } = await serviceSupabase
  .from('orders')
  .select('id, status, customer_email, created_at')
  .eq('status', 'pending')
  .order('created_at', { ascending: false });
```

### Pattern 2: Count aggregations

```typescript
// ✅ Good: Explicit counts with filters
const { data: pendingCount } = await serviceSupabase
  .from('orders')
  .select('id')
  .eq('status', 'pending');

const { data: completedCount } = await serviceSupabase
  .from('orders')
  .select('id')
  .eq('status', 'completed');

const totalOrders = (pendingCount?.length || 0) + (completedCount?.length || 0);
```

### Pattern 3: Aggregation (if using SQL view)

```typescript
// Create this SQL view in Supabase dashboard:
CREATE OR REPLACE VIEW order_stats AS
SELECT 
  COUNT(*) as total_orders,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
  SUM(CASE WHEN status = 'completed' THEN total ELSE 0 END) as total_revenue
FROM orders;

-- Then query it:
const { data: stats, error } = await serviceSupabase
  .from('order_stats')
  .select('*')
  .single();

if (error) {
  console.error('Stats error:', error);
  return { pending: 0, total: 0, revenue: 0 };
}

return {
  pending: stats.pending_orders || 0,
  total: stats.total_orders || 0,
  revenue: stats.total_revenue || 0
};
```

### Pattern 4: Update with verification

```typescript
// ✅ Good: Verify before updating
const { data: order, error: fetchError } = await serviceSupabase
  .from('orders')
  .select('*')
  .eq('id', orderId)
  .single();

if (fetchError || !order) {
  return { error: 'Order not found', status: 404 };
}

if (order.status !== 'pending') {
  return { error: 'Can only approve pending orders', status: 400 };
}

const { data: updated, error: updateError } = await serviceSupabase
  .from('orders')
  .update({
    status: 'accepted',
    updated_at: new Date().toISOString()
  })
  .eq('id', orderId)
  .select()
  .single();

if (updateError) {
  return { error: updateError.message, status: 500 };
}

return { success: true, data: updated };
```

---

## RLS Configuration for Admin

### Current RLS Issues

Your schema has this policy:
```sql
CREATE POLICY "Admin view all orders" ON orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
```

**Problem:** If admin's profile doesn't have `is_admin = true`, this fails silently.

### Fixed RLS Strategy

```sql
-- 1. Make sure profiles are created for ALL users
-- (You have a trigger for this, good!)

-- 2. Ensure service role key can bypass RLS
-- (Supabase does this by default, no config needed)

-- 3. Add admin-specific policies
CREATE POLICY "Admin can view any order" ON orders FOR SELECT 
USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
);

-- 4. Keep user policies for regular users
CREATE POLICY "Users can view own orders" ON orders FOR SELECT 
USING (auth.uid() = user_id);

-- 5. IMPORTANT: Disable RLS for order files since admin access is checked server-side
-- OR keep RLS but ensure admin profile has is_admin = true
CREATE POLICY "Admin can view all files" ON order_files FOR SELECT 
USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
);
```

### RLS Debugging Checklist

```sql
-- 1. Verify profile exists and is_admin is set
SELECT id, full_name, is_admin 
FROM profiles 
WHERE id = 'your-uuid-here';

-- Expected: Row with is_admin = true

-- 2. If missing, insert manually
INSERT INTO profiles (id, full_name, is_admin) 
VALUES ('your-uuid', 'Your Name', true)
ON CONFLICT(id) DO UPDATE 
SET is_admin = true;

-- 3. Test the policy directly (in Supabase SQL editor)
-- As admin user, should see orders
SELECT * FROM orders LIMIT 1;

-- As non-admin, should see nothing (or filtered to own orders)
```

---

## Data Integrity: Status Enum Fix

### Problem

Your `orders.status` allows:
```sql
status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled'))
```

But approve.ts sets:
```typescript
update({ status: 'approved' })  // ❌ This will FAIL (not in enum)
```

### Fix

**Option 1: Update enum** (if 'approved' is different from 'accepted')
```sql
ALTER TABLE orders 
DROP CONSTRAINT orders_status_check;

ALTER TABLE orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled'));
```

**Option 2: Use 'accepted' instead of 'approved'**
```typescript
// approve.ts
update({
  status: 'accepted',  // ✅ Matches enum
  updated_at: new Date().toISOString()
})
```

---

## Common Pitfalls & How to Avoid

### Pitfall 1: Exposing Service Role Key to Frontend

```typescript
// ❌ NEVER DO THIS
const response = await fetch('https://...');
const supabase = createClient(
  PUBLIC_URL,
  SUPABASE_SERVICE_ROLE_KEY  // ← EXPOSED TO BROWSER!
);
```

**Why it's bad:** Anyone can call your Supabase API without auth checks.

**Fix:** Always use service role ONLY in API endpoints (`.ts` files), never in client code.

---

### Pitfall 2: Silent Supabase Failures

```typescript
// ❌ BAD: No error propagation
const { data } = await supabase.from('orders').select('*');
console.log('Orders:', data);  // Might be []

// ✅ GOOD: Explicit error handling
const { data, error } = await supabase.from('orders').select('*');
if (error) {
  console.error('Query failed:', error.message);
  return { error: error.message, status: 500 };
}
console.log('Orders:', data);
```

**Key insight:** When RLS blocks a query, `error` is NULL and `data` is an empty array. **Always check and log the error object.**

---

### Pitfall 3: Assuming User is Authenticated Just Because Page Loaded

```typescript
// ❌ BAD: Page checks auth, but API doesn't
// admin.astro does the check
if (!userIsAdmin) return redirect('/');
// User is redirected if not admin ✅

// But then frontend calls API...
fetch('/api/admin/orders')  // ← No auth check here!

// ❌ If someone gets past the page redirect (or uses API directly),
// API endpoint has no protection
```

**Fix:** Every API endpoint must independently verify auth and admin status.

---

### Pitfall 4: RLS Policies Checking Non-Existent Profile Data

```sql
-- ❌ BAD: Policy fails silently if profile doesn't exist
CREATE POLICY "Admin only" ON orders FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_admin = true  -- ← If profile missing, EXISTS returns false
  )
);

-- What happens:
-- 1. Admin visits page → Profile missing → Cannot see orders
-- 2. Admin creates profile → Now can see orders
-- 3. Admin forgets `is_admin = true` → Cannot see orders again
```

**Fix:** Ensure profiles are created on signup (you have trigger ✅), and set `is_admin = true` manually for admins.

---

### Pitfall 5: String-Based Status Filtering

```typescript
// ❌ BAD: Fragile filtering
const pendingOrders = orders.filter(order =>
  !order.description?.startsWith('[APPROVED]')
);

// Problems:
// - What if you update the order then forget to update description?
// - What if someone includes "[APPROVED]" in actual description?
// - This only works for pending orders, not completed/rejected splits

// ✅ GOOD: Status column is source of truth
const pendingOrders = orders.filter(order => order.status === 'pending');
```

---

### Pitfall 6: Not Handling Empty States

```typescript
// ❌ BAD: Shows "0" without context
document.getElementById('pendingCount').textContent = 0;

// User sees:
// "Pending Orders: 0"
// ^ Did the query fail? Or are there really no orders?

// ✅ GOOD: Explicit empty states
if (orders.length === 0) {
  ordersList.innerHTML = `
    <div class="empty-state">
      <h3>No pending orders</h3>
      <p>All orders have been processed</p>
    </div>
  `;
} else {
  // Render orders
}
```

---

## Deployment Checklist

Before going live, verify:

- [ ] Admin user's profile has `is_admin = true` in profiles table
- [ ] `/api/admin/*` endpoints verify `is_admin` before using service role
- [ ] All Supabase queries explicitly handle errors (not silent failures)
- [ ] RLS policies match your auth strategy
- [ ] Status enum in database matches what code uses
- [ ] Service role key is `.env.local` only (never in git/frontend)
- [ ] Admin page redirects non-admins on server-side (Astro frontmatter)
- [ ] Database has 1+ row in profiles with your UUID and is_admin=true
- [ ] All API endpoints return errors, never empty arrays for unexpected failures
- [ ] UI shows meaningful empty states (not just "0")

---

## Quick Reference: Admin Architecture

```
Admin Auth Checklist
===================

1. Admin visits /admin
   └─ admin.astro server checks:
      ├─ User authenticated? (auth.getUser)
      └─ is_admin = true? (profiles table)
   
2. If both pass → Render page
   └─ Pass auth context (NOT session keys)

3. User clicks "Load Orders"
   └─ Frontend fetch /api/admin/orders

4. API endpoint checks:
   ├─ User authenticated? (getUser from cookies)
   ├─ is_admin = true? (profiles table)
   └─ No RLS bypass attempts?

5. If all pass → Use service role to query
   └─ Always handle errors explicitly

6. Return to frontend:
   ├─ Success: { success: true, data: [] }
   └─ Error: { error: "...", status: 500 }

7. Frontend displays:
   ├─ If success and data empty: "No pending orders"
   └─ If error: "Failed to load orders: ..."
```

---

## Next Steps

1. **Set your admin:** In Supabase dashboard, update your profile to `is_admin = true`
2. **Deploy fixed endpoints:** Copy the secure API patterns below
3. **Fix admin.astro:** Use the server-side auth pattern provided
4. **Test thoroughly:** Try accessing admin as non-admin (should redirect)
5. **Monitor logs:** Watch for RLS errors or query failures

