# Admin Dashboard Implementation Guide

## Overview

This guide provides step-by-step instructions to upgrade your admin dashboard with secure, reliable Supabase integration.

---

## Part 1: Database Setup

### 1.1 Verify admin user has is_admin = true

Run this in your Supabase SQL editor:

```sql
-- Check if your user profile has is_admin = true
SELECT id, full_name, is_admin 
FROM profiles 
WHERE email = 'nikhil.as.rajpoot@gmail.com'  -- Change to your email
LIMIT 1;
```

If the result is empty or `is_admin` is `false`, run:

```sql
-- Get your user ID from auth.users
SELECT id, email FROM auth.users WHERE email = 'nikhil.as.rajpoot@gmail.com';

-- Then update/insert your profile (replace YOUR_UUID with actual ID)
INSERT INTO profiles (id, full_name, is_admin) 
VALUES ('YOUR_UUID', 'Your Name', true)
ON CONFLICT(id) 
DO UPDATE SET is_admin = true;
```

### 1.2 Fix status enum if needed

Check if your orders table allows 'accepted' and 'rejected':

```sql
-- View current constraint
SELECT constraint_name, constraint_definition 
FROM information_schema.domain_constraints 
WHERE domain_name = 'orders_status';

-- If needed, update the constraint:
ALTER TABLE orders 
DROP CONSTRAINT orders_status_check;

ALTER TABLE orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled'));
```

### 1.3 Add rejection_reason column (optional)

```sql
-- Add if it doesn't exist
ALTER TABLE orders ADD COLUMN rejection_reason TEXT;

-- Or make it non-null with default
ALTER TABLE orders ADD COLUMN rejection_reason TEXT DEFAULT 'No reason provided';
```

### 1.4 Verify RLS policies

```sql
-- List all policies on orders table
SELECT * FROM pg_policies WHERE tablename = 'orders';

-- You should see policies for:
-- - Admin view all orders
-- - Users view own orders
-- - Anyone create orders
-- - Admin update orders
```

---

## Part 2: API Endpoint Migration

### 2.1 Keep existing endpoints intact (backward compatible)

Your current `/api/admin/orders` endpoint works but lacks security checks. We've created new secure versions:

- **NEW:** `/api/admin/orders-secure.ts` ← Use this
- **KEEP:** `/api/admin/orders.ts` ← Existing (legacy)

### 2.2 Use the new secure endpoints

Replace these API calls in your admin.astro JavaScript:

**Before:**
```javascript
fetch('/api/admin/orders')
fetch('/api/admin/orders/approve', { method: 'POST', ... })
fetch('/api/admin/orders/reject', { method: 'POST', ... })
```

**After:**
```javascript
fetch('/api/admin/orders-secure')        // ← New secure endpoint
fetch('/api/admin/orders/approve-secure', { method: 'POST', ... })  // ← New
fetch('/api/admin/orders/reject-secure', { method: 'POST', ... })   // ← New
fetch('/api/admin/stats', { method: 'GET' })  // ← For stats
```

### 2.3 Update error handling in JavaScript

**Before (current):**
```javascript
async function updateStats() {
  const ordersResponse = await fetch('/api/admin/orders');
  const orders = await ordersResponse.json();
  document.getElementById('totalOrders').textContent = orders.length;  // Hides errors
}
```

**After (new):**
```javascript
async function updateStats() {
  try {
    const response = await fetch('/api/admin/stats');
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Stats error:', error);
      showNotification(`Failed to load stats: ${error.error}`, 'error');
      return;
    }

    const result = await response.json();
    if (!result.success) {
      showNotification(`Error: ${result.error}`, 'error');
      return;
    }

    const stats = result.data;
    document.getElementById('totalOrders').textContent = stats.total_orders || 0;
    document.getElementById('pendingCount').textContent = stats.pending_orders || 0;
    document.getElementById('completedCount').textContent = stats.completed_orders || 0;
    document.getElementById('revenue').textContent = `$${stats.total_revenue.toFixed(2)}`;

  } catch (error) {
    console.error('Unexpected stats error:', error);
    showNotification('Network error loading stats', 'error');
  }
}
```

---

## Part 3: Update admin.astro

### 3.1 Server-side auth (already exists, verify it's correct)

Your current admin.astro has this ✅ (good):

```astro
---
const serverSupabase = createSupabaseServerClient(Astro.cookies);

const { data: { user: authUser }, error: authError } = await serverSupabase.auth.getUser();
if (authError || !authUser) return Astro.redirect('/login');

const { data: profile } = await serverSupabase
  .from('profiles')
  .select('is_admin')
  .eq('id', authUser.id)
  .single();

if (!profile?.is_admin) return Astro.redirect('/?error=admin_required');
---
```

**This is secure.** Keep it.

### 3.2 Update fetch endpoints in JavaScript section

Find this section in your admin.astro (line ~1336):

```javascript
// Load orders for management
async function loadOrders() {
  try {
    const response = await fetch('/api/admin/orders');  // ← UPDATE THIS
    const orders = await response.json();
    // ... rest of function
  }
}
```

**Change to:**

```javascript
// Load orders for management
async function loadOrders() {
  try {
    const response = await fetch('/api/admin/orders-secure');  // ← Updated endpoint
    
    // NEW: Check response status
    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to load orders:', error);
      
      const ordersList = document.getElementById('ordersList');
      ordersList.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" stroke="currentColor" stroke-width="2"/>
          </svg>
          <h3>Error loading orders</h3>
          <p>${error.error || 'Failed to fetch orders from server'}</p>
        </div>
      `;
      return;
    }

    const result = await response.json();
    
    // NEW: Check if result has success flag
    if (!result.success) {
      console.error('Orders query failed:', result);
      const ordersList = document.getElementById('ordersList');
      ordersList.innerHTML = `
        <div class="empty-state">
          <h3>Error</h3>
          <p>${result.error}</p>
        </div>
      `;
      return;
    }

    const orders = result.data || [];  // Use result.data instead of just result

    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = '';

    if (orders.length === 0) {
      ordersList.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" stroke-width="2"/>
          </svg>
          <h3>No pending orders</h3>
          <p>All orders have been processed</p>
        </div>
      `;
      return;
    }

    // Rest of function (rendering orders)...
  } catch (error) {
    console.error('Error loading orders:', error);
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = `
      <div class="empty-state">
        <h3>Connection error</h3>
        <p>Please refresh the page and try again</p>
      </div>
    `;
  }
}
```

### 3.3 Update approve/reject handlers

Find these functions:

```javascript
async function approveOrder(orderId) {
  if (!confirm('Approve this order?')) return;
  
  const response = await fetch('/api/admin/orders/approve', {  // ← UPDATE
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId })
  });
  
  if (response.ok) {
    loadOrders();
    updateStats();
  }
}
```

**Change to:**

```javascript
async function approveOrder(orderId) {
  if (!confirm('Are you sure you want to approve this order?')) return;

  try {
    const response = await fetch('/api/admin/orders/approve-secure', {  // ← New endpoint
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Approval failed:', result);
      showNotification(`Approval failed: ${result.error}`, 'error');
      return;
    }

    if (!result.success) {
      showNotification(`Error: ${result.error}`, 'error');
      return;
    }

    showNotification('Order approved successfully!', 'success');
    loadOrders();
    updateStats();
  } catch (error) {
    console.error('Approve error:', error);
    showNotification('Network error approving order', 'error');
  }
}
```

**Similar update for reject:**

```javascript
async function rejectOrder(orderId) {
  const reason = prompt('Enter rejection reason (optional):');
  if (reason === null) return;  // User cancelled

  try {
    const response = await fetch('/api/admin/orders/reject-secure', {  // ← New endpoint
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, reason: reason || '' })
    });

    const result = await response.json();

    if (!response.ok) {
      showNotification(`Rejection failed: ${result.error}`, 'error');
      return;
    }

    if (!result.success) {
      showNotification(`Error: ${result.error}`, 'error');
      return;
    }

    showNotification('Order rejected successfully!', 'success');
    loadOrders();
    updateStats();
  } catch (error) {
    console.error('Reject error:', error);
    showNotification('Network error rejecting order', 'error');
  }
}
```

---

## Part 4: Testing

### 4.1 Test as admin

1. Log in as admin user
2. Visit `/admin`
3. Should load and display orders
4. Check browser console for any errors
5. Try approving an order

### 4.2 Test as non-admin

1. Log in as non-admin user
2. Visit `/admin`
3. Should redirect to home with `error=admin_required`

### 4.3 Test error scenarios

1. **Approve already-approved order** → Should show "Cannot approve order with status accepted"
2. **Network error** → Should show "Network error" message
3. **No pending orders** → Should show "No pending orders" message

### 4.4 Check logs

Monitor these browser console logs:

```javascript
// Should see
console.log('✅ Admin verified: your@email.com');
console.log('Admin orders retrieved:', { admin_user: '...', count: 5 });
console.log('Order approved:', { order_id: '...', admin: '...' });

// Should NOT see
console.error('Admin access denied');
console.error('RLS block or DB error');
```

---

## Part 5: Production Deployment

### 5.1 Pre-deployment checklist

- [ ] Admin profile has `is_admin = true` in database
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local` (not committed)
- [ ] All API endpoints verify admin status
- [ ] Error handling is explicit (no silent failures)
- [ ] Empty states show meaningful messages
- [ ] RLS policies are in place (optional but recommended)

### 5.2 Deployment steps

1. **Update admin.astro** with new fetch endpoints
2. **Deploy API endpoints** (or rename endpoints in code)
3. **Test admin dashboard** in staging
4. **Roll out to production**

### 5.3 Monitoring

Monitor these after deployment:

```javascript
// In browser console, you should see:
// 1. Auth check passing
console.log('✅ Admin verified');

// 2. API calls returning structured responses
{
  "success": true,
  "data": [...],
  "meta": { "admin_email": "..." }
}

// 3. Errors being logged explicitly
{
  "error": "...",
  "code": "...",
  "details": "..."
}
```

---

## Part 6: Troubleshooting

### Problem: Admin page redirects me even though I'm admin

**Solution:**
1. Check your email is set as admin in database:
   ```sql
   SELECT is_admin FROM profiles WHERE id = 'your-user-id';
   ```
   Should return `true`

2. Check auth cookies exist:
   - Open DevTools → Application → Cookies
   - Look for `sb-access-token` (or similar)

3. Check server logs for auth errors:
   - Look for `Admin access denied` messages
   - Verify no profile lookup errors

### Problem: Orders list shows empty but I have pending orders

**Solution:**
1. Check API response:
   - Open DevTools → Network
   - Call `/api/admin/orders-secure`
   - Check if `success: false` or error in response

2. Check database:
   ```sql
   SELECT id, status FROM orders 
   WHERE status = 'pending' 
   LIMIT 5;
   ```

3. Check RLS policies (optional debug):
   - If query returns error, RLS might be blocking
   - Use service role key to bypass RLS

### Problem: Can't approve orders (button does nothing)

**Solution:**
1. Check browser console for errors
2. Verify order exists:
   ```sql
   SELECT id, status FROM orders WHERE id = 'order-id';
   ```
3. Check API response:
   - Network tab
   - Look for error code and message
4. Ensure order is in `pending` status (not already `accepted`)

### Problem: Database constraint error when approving

**Error:** `new row violates check constraint "orders_status_check"`

**Solution:**
- Your enum doesn't have 'accepted'
- Run SQL fix from Part 1.2

---

## Implementation Checklist

Use this to track your progress:

```
Database Setup
├─ [ ] Verified admin profile has is_admin = true
├─ [ ] Status enum includes 'accepted' and 'rejected'
├─ [ ] Optional: Added rejection_reason column
└─ [ ] RLS policies are in place

API Endpoints
├─ [ ] Created /api/admin/orders-secure.ts
├─ [ ] Created /api/admin/orders/approve-secure.ts
├─ [ ] Created /api/admin/orders/reject-secure.ts
├─ [ ] Created /api/admin/stats.ts
└─ [ ] Verified all return structured { success, error, data }

Admin.astro Updates
├─ [ ] Server-side auth check is correct (✅ already good)
├─ [ ] Updated loadOrders() to use /api/admin/orders-secure
├─ [ ] Updated updateStats() to handle errors
├─ [ ] Updated approveOrder() to use /api/admin/orders/approve-secure
├─ [ ] Updated rejectOrder() to use /api/admin/orders/reject-secure
└─ [ ] Empty state messages are meaningful

Testing
├─ [ ] Admin can see orders
├─ [ ] Non-admin is redirected
├─ [ ] Approving order works
├─ [ ] Rejecting order works
├─ [ ] Error messages display correctly
└─ [ ] No silent failures in console

Deployment
├─ [ ] All .env variables are set
├─ [ ] Service role key is in .env.local (not git)
├─ [ ] Tested in staging environment
└─ [ ] Deployed to production
```

---

## Next Steps

1. **Set up your admin user** (Part 1.1)
2. **Create the API endpoints** (create files from repository)
3. **Update admin.astro** with new fetch calls
4. **Test thoroughly** using Part 4
5. **Deploy confidently** with Part 5

---

## Support & Questions

If you encounter issues:

1. Check console logs (browser DevTools)
2. Check Supabase dashboard logs
3. Verify database state with SQL queries
4. Review the ADMIN_SECURITY_GUIDE.md for background

Good luck! 🚀
