# Row Level Security (RLS) for Admin Dashboard

## What is RLS?

**RLS = Row-Level Security**

It's Supabase's way of saying: "Only return rows that match certain conditions based on who is asking."

```
Regular SQL query (no RLS):
SELECT * FROM orders;
→ Returns ALL orders to EVERYONE

With RLS enabled:
SELECT * FROM orders;
→ Returns different results based on who's asking:
  - Admin sees: All orders
  - User sees: Only their own orders
  - Hacker sees: Nothing (auth fails)
```

---

## Your Current RLS Setup

Your schema has these policies:

```sql
-- Policy 1: Users can view their own orders
CREATE POLICY "Users view own orders" ON orders FOR SELECT 
USING (auth.uid() = user_id);

-- Policy 2: Guests can view orders by email
CREATE POLICY "Guests view own orders by email" ON orders FOR SELECT 
USING (auth.uid() IS NULL AND customer_email IS NOT NULL);

-- Policy 3: Admin can view all orders
CREATE POLICY "Admin view all orders" ON orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Policy 4: Anyone can create orders
CREATE POLICY "Anyone create orders" ON orders FOR INSERT WITH CHECK (true);

-- Policy 5: Only admins can update orders
CREATE POLICY "Admin update orders" ON orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
```

---

## Why RLS Might Be Blocking Your Admin

### Scenario 1: Admin profile missing `is_admin = true`

```sql
-- What happens
SELECT * FROM orders;  -- As admin user

-- RLS evaluation:
-- Policy 1: auth.uid() = user_id? No (admin != customer)
-- Policy 2: auth.uid() IS NULL? No (admin is authenticated)
-- Policy 3: EXISTS (profiles where id=admin_id AND is_admin=true)? 
--           → Database lookup fails or returns FALSE
-- Result: No policy matches → No rows returned
```

**Fix:** Ensure your profile row has `is_admin = true`

```sql
SELECT id, is_admin FROM profiles WHERE id = 'your-uuid';
-- Must return: (your-uuid, true)

-- If false or missing:
UPDATE profiles SET is_admin = true WHERE id = 'your-uuid';
-- Or:
INSERT INTO profiles (id, full_name, is_admin) 
VALUES ('your-uuid', 'Your Name', true)
ON CONFLICT(id) DO UPDATE SET is_admin = true;
```

### Scenario 2: RLS blocking query silently

When you run a query with RLS enabled:

```typescript
const { data, error } = await supabase
  .from('orders')
  .select('*');

// If RLS blocks it:
// data = [] (empty array!)
// error = null (NO ERROR!)

// This hides the real problem
console.log('Orders:', data);  // Shows []
// ^ Looks like "no orders" but actually means "RLS blocked you"
```

**Fix:** Use the service role to bypass RLS

```typescript
// Instead of using auth
const { data } = await supabase
  .from('orders')
  .select('*');

// Use service role (in API endpoint only!)
const serviceSupabase = createClient(
  PUBLIC_URL,
  SUPABASE_SERVICE_ROLE_KEY  // ← Bypasses RLS
);

const { data, error } = await serviceSupabase
  .from('orders')
  .select('*');
```

---

## RLS Strategy for Your Admin Dashboard

### Option 1: Service Role in API (RECOMMENDED)

**How it works:**
1. Browser calls `/api/admin/orders` (your endpoint)
2. Endpoint uses service role key to query (bypasses RLS)
3. Endpoint verifies admin status before querying
4. Never expose service role key to browser

**Pros:**
- ✅ Simple and secure
- ✅ Admin status verified server-side
- ✅ Service role key hidden
- ✅ RLS policies still protect regular users

**Cons:**
- Requires API endpoints (you have them)

**Code:**
```typescript
// In /api/admin/orders.ts
const serviceSupabase = createClient(
  PUBLIC_URL,
  SUPABASE_SERVICE_ROLE_KEY  // ← Bypasses RLS
);

// Verify admin FIRST
const { data: profile } = await serverSupabase
  .from('profiles')
  .select('is_admin')
  .eq('id', user.id)
  .single();

if (!profile?.is_admin) {
  return error('Not admin');
}

// THEN query with service role
const { data: orders } = await serviceSupabase
  .from('orders')
  .select('*');  // ← RLS is bypassed, but we verified admin above
```

### Option 2: Fix RLS Policies (ALTERNATIVE)

**If you want to use regular auth in API:**

```sql
-- Enable RLS but refine policies
CREATE POLICY "Admin can see all orders" ON orders FOR SELECT 
USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Keep user policies
CREATE POLICY "User can see own orders" ON orders FOR SELECT 
USING (auth.uid() = user_id);
```

**Pros:**
- No service role key needed in API
- Consistent RLS evaluation

**Cons:**
- Requires profile to have is_admin = true (fragile)
- RLS still silently blocks if profile is missing
- Harder to debug

---

## RLS Best Practices

### ✅ DO: Enable RLS on sensitive tables

```sql
-- Good: Protect user data
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_files ENABLE ROW LEVEL SECURITY;
```

### ✅ DO: Use service role for admin operations

```typescript
// In API endpoint (server-side only)
const serviceSupabase = createClient(
  PUBLIC_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

// Verify admin BEFORE querying
const isAdmin = await verifyAdmin(user.id);
if (!isAdmin) return error('Not admin');

// Then query
const { data } = await serviceSupabase.from('orders').select('*');
```

### ✅ DO: Log when RLS blocks queries

```typescript
// Treat empty results as potential RLS blocks
const { data, error } = await supabase.from('orders').select('*');

if (error) {
  console.error('RLS or DB error:', error.message);
}

if (data.length === 0) {
  console.warn('No data or RLS blocked query');
}
```

### ❌ DON'T: Expose service role to browser

```typescript
// ❌ NEVER DO THIS
const supabase = createClient(
  PUBLIC_URL,
  SUPABASE_SERVICE_ROLE_KEY  // ← EXPOSED!
);
```

### ❌ DON'T: Assume empty array means no data

```typescript
// ❌ Bad: Can't tell if RLS blocked or no data
const { data } = await supabase.from('orders').select('*');
console.log(data.length);  // 0 - but why?

// ✅ Good: Check error too
const { data, error } = await supabase.from('orders').select('*');
if (error) console.error('Error:', error);
console.log(data.length);  // Now we know the truth
```

### ❌ DON'T: Disable RLS globally

```sql
-- ❌ NEVER DO THIS
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
```

**Why?**
- Anyone can access anyone's data
- No protection against hacks
- Violates user privacy

---

## RLS Debugging

### Debug 1: Is RLS enabled?

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('orders', 'profiles', 'order_files');

-- Should show rowsecurity = true for sensitive tables
```

### Debug 2: What policies exist?

```sql
-- List all policies on orders table
SELECT policyname, qual, with_check 
FROM pg_policies 
WHERE tablename = 'orders';

-- Output example:
-- policyname                  | qual                                          | with_check
-- Admin view all orders       | (...is_admin = true)                         | -
-- User view own orders        | (auth.uid() = user_id)                       | -
-- Anyone create orders        | true                                          | true
```

### Debug 3: Is admin policy working?

```sql
-- Test as admin user (in SQL editor)
-- Switch to "Use" dropdown → Select your user email

-- Then run:
SELECT COUNT(*) FROM orders;

-- Should return actual count, not 0
-- If returns 0, RLS is blocking even though you're admin
```

### Debug 4: Check profile has is_admin = true

```sql
-- If RLS is blocking, usually the problem is here:
SELECT id, full_name, is_admin 
FROM profiles 
WHERE id = 'your-user-id';

-- Must show: (your-id, Your Name, true)
```

### Debug 5: Test service role

```typescript
// In browser console (or API endpoint)
const { data, error } = await serviceSupabase
  .from('orders')
  .select('COUNT(*)', { count: 'exact' });

// Service role should return actual count
// Regular auth might return 0 due to RLS
```

---

## RLS Policy Templates

### Template 1: User sees only their own data

```sql
CREATE POLICY "Users see own data" ON orders FOR SELECT 
USING (auth.uid() = user_id);
```

### Template 2: Admin sees everything

```sql
CREATE POLICY "Admin sees all data" ON orders FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
```

### Template 3: Users can update own data, admin can update any

```sql
CREATE POLICY "Users update own data" ON orders FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admin update any data" ON orders FOR UPDATE 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
```

### Template 4: Time-based access

```sql
-- Only see orders from last 30 days
CREATE POLICY "Recent orders only" ON orders FOR SELECT 
USING (created_at > now() - interval '30 days');
```

### Template 5: Status-based access

```sql
-- Only see completed orders
CREATE POLICY "Completed orders" ON orders FOR SELECT 
USING (status = 'completed');
```

---

## Troubleshooting RLS Issues

### Issue: Admin sees empty list

**Diagnosis:**
```sql
-- Check if profile exists and is_admin = true
SELECT is_admin FROM profiles WHERE id = 'admin-uuid';
-- Result: Should be true
```

**Fix:**
```sql
-- If false or missing:
UPDATE profiles SET is_admin = true WHERE id = 'admin-uuid';
```

**Also check:**
- Admin user has auth session (cookies set)
- Profile row actually exists in database

---

### Issue: Regular user can see all orders

**Diagnosis:**
```sql
-- Check policy exists
SELECT policyname FROM pg_policies WHERE tablename = 'orders';
-- Should include "User can view own orders"

-- Check RLS is enabled
SELECT rowsecurity FROM pg_tables WHERE tablename = 'orders';
-- Should be true
```

**Fix:**
```sql
-- Re-enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Re-create policy
CREATE POLICY "User sees own orders" ON orders FOR SELECT 
USING (auth.uid() = user_id);
```

---

### Issue: Service role bypasses security

**This is intentional**, but guard against it:

```typescript
// ❌ Bad: Service role without auth check
const { data } = await serviceSupabase.from('orders').select('*');

// ✅ Good: Verify admin FIRST, then use service role
const isAdmin = await verifyAdminStatus(user.id);
if (!isAdmin) throw new Error('Not admin');

const { data } = await serviceSupabase.from('orders').select('*');
```

---

## Decision: RLS Strategy for Your Admin

### Recommended: Service Role + API Verification

**Why:**
1. Simple - just use service role in endpoints
2. Secure - verify admin before querying
3. Reliable - no RLS blocking surprises
4. Debuggable - explicit error messages

**How:**
1. Create `/api/admin/orders.ts` ✅ (done)
2. Verify admin status in endpoint
3. Use service role to query
4. Return explicit errors

**Code pattern:**
```typescript
export const GET: APIRoute = async ({ request, cookies }) => {
  // 1. Verify user authenticated
  const user = await getAuthUser(serverSupabase);
  if (!user) return error('Not authenticated');

  // 2. Verify user is admin
  const isAdmin = await verifyAdmin(user.id);
  if (!isAdmin) return error('Not admin');

  // 3. Use service role to query (RLS bypassed)
  const { data, error } = await serviceSupabase
    .from('orders')
    .select('*');

  // 4. Return explicit error or data
  if (error) return error(error.message);
  return success(data);
};
```

---

## Summary Table

| Scenario | Solution | Code |
|----------|----------|------|
| Admin dashboard needs all orders | Service role + verify admin | `createClient(url, SERVICE_ROLE_KEY)` |
| Regular user needs own orders | RLS policy checks `auth.uid() = user_id` | Enable RLS, create policy |
| Debugging empty results | Check error object, not just data | `if (error) console.error(error)` |
| Admin blocked by RLS | Set `is_admin = true` in profiles | `UPDATE profiles SET is_admin = true` |
| Exposing service role risk | Never put in browser code | Use only in `.ts` API endpoints |

---

## Next Steps

1. **Verify your admin profile has is_admin = true**
   ```sql
   SELECT is_admin FROM profiles WHERE id = 'your-id';
   ```

2. **Use service role strategy in API endpoints** (already provided)

3. **Keep RLS enabled for regular tables** (good for security)

4. **Never expose service role to browser** (keep in .env.local)

5. **Test with debug logs** (see what's actually happening)

