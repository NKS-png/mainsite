# Admin.astro Code Changes Required

This document shows exactly what needs to change in your `src/pages/admin.astro` file.

---

## Changes Required: 3 Fetch Endpoints + Error Handling

### Change 1: Update loadOrders() function

**Location:** Around line 1353

**Find this code:**
```javascript
async function loadOrders() {
  try {
    const response = await fetch('/api/admin/orders');
    const orders = await response.json();

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

    orders.forEach(order => {
      // ... rest of rendering code
    });

  } catch (error) {
    console.error('Error loading orders:', error);
  }
}
```

**Replace with this code:**
```javascript
async function loadOrders() {
  try {
    const response = await fetch('/api/admin/orders-secure');
    
    // NEW: Check HTTP response status
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
    
    // NEW: Check if API returned success
    if (!result.success) {
      console.error('Orders query failed:', result);
      const ordersList = document.getElementById('ordersList');
      ordersList.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" stroke="currentColor" stroke-width="2"/>
          </svg>
          <h3>Error</h3>
          <p>${result.error}</p>
        </div>
      `;
      return;
    }

    // NEW: Use result.data instead of just orders
    const orders = result.data || [];

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

    orders.forEach(order => {
      // ... existing rendering code stays the same
    });

  } catch (error) {
    console.error('Error loading orders:', error);
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" stroke="currentColor" stroke-width="2"/>
        </svg>
        <h3>Connection error</h3>
        <p>Please refresh the page and try again</p>
      </div>
    `;
  }
}
```

---

### Change 2: Update approveOrder() function

**Location:** Around line 1481

**Find this code:**
```javascript
async function approveOrder(orderId) {
  if (!confirm('Are you sure you want to approve this order? This will send an approval email to the customer.')) return;

  try {
    const response = await fetch('/api/admin/orders/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });

    if (response.ok) {
      alert('Order approved successfully!');
      loadOrders();
      updateStats();
    } else {
      alert('Failed to approve order');
    }
  } catch (error) {
    console.error('Approve error:', error);
    alert('Approve failed. Please try again.');
  }
}
```

**Replace with this code:**
```javascript
async function approveOrder(orderId) {
  if (!confirm('Are you sure you want to approve this order? This will send an approval email to the customer.')) return;

  try {
    const response = await fetch('/api/admin/orders/approve-secure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });

    const result = await response.json();

    // NEW: Check HTTP status
    if (!response.ok) {
      console.error('Approval failed:', result);
      showNotification(`Approval failed: ${result.error}`, 'error');
      return;
    }

    // NEW: Check response success flag
    if (!result.success) {
      console.error('Approval error:', result);
      showNotification(`Error: ${result.error}`, 'error');
      return;
    }

    // Success!
    showNotification('Order approved successfully!', 'success');
    loadOrders();
    updateStats();
    
  } catch (error) {
    console.error('Approve error:', error);
    showNotification('Network error approving order', 'error');
  }
}
```

---

### Change 3: Update rejectOrder() function

**Location:** Around line 1505

**Find this code:**
```javascript
async function rejectOrder(orderId) {
  if (!confirm('Are you sure you want to reject this order?')) return;

  try {
    const response = await fetch('/api/admin/orders/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });

    if (response.ok) {
      alert('Order rejected successfully!');
      loadOrders();
      updateStats();
    } else {
      alert('Failed to reject order');
    }
  } catch (error) {
    console.error('Reject error:', error);
    alert('Reject failed. Please try again.');
  }
}
```

**Replace with this code:**
```javascript
async function rejectOrder(orderId) {
  const reason = prompt('Enter rejection reason (optional):');
  if (reason === null) return;  // User clicked cancel

  try {
    const response = await fetch('/api/admin/orders/reject-secure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, reason: reason || '' })
    });

    const result = await response.json();

    // NEW: Check HTTP status
    if (!response.ok) {
      console.error('Rejection failed:', result);
      showNotification(`Rejection failed: ${result.error}`, 'error');
      return;
    }

    // NEW: Check response success flag
    if (!result.success) {
      console.error('Rejection error:', result);
      showNotification(`Error: ${result.error}`, 'error');
      return;
    }

    // Success!
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

### Change 4: Update updateStats() function

**Location:** Around line 1336

**Find this code:**
```javascript
async function updateStats() {
  try {
    const ordersResponse = await fetch('/api/admin/orders');
    const orders = await ordersResponse.json();

    document.getElementById('totalOrders').textContent = orders.length;
    document.getElementById('pendingCount').textContent = orders.filter(o => o.status === 'pending').length;

    const revenue = orders.reduce((sum, order) => sum + (parseFloat(order.price) || 0), 0);
    document.getElementById('revenue').textContent = `$${revenue.toFixed(2)}`;

  } catch (error) {
    console.error('Error updating stats:', error);
  }
}
```

**Replace with this code:**
```javascript
async function updateStats() {
  try {
    const response = await fetch('/api/admin/stats');
    
    // NEW: Check HTTP status
    if (!response.ok) {
      const error = await response.json();
      console.error('Stats error:', error);
      showNotification(`Failed to load stats: ${error.error}`, 'error');
      return;
    }

    const result = await response.json();
    
    // NEW: Check response success flag
    if (!result.success) {
      console.error('Stats query failed:', result);
      showNotification(`Error: ${result.error}`, 'error');
      return;
    }

    // NEW: Use new stats endpoint data
    const stats = result.data;
    document.getElementById('totalOrders').textContent = stats.total_orders || 0;
    document.getElementById('pendingCount').textContent = stats.pending_orders || 0;
    document.getElementById('revenue').textContent = `$${stats.total_revenue?.toFixed(2) || '0.00'}`;

  } catch (error) {
    console.error('Error updating stats:', error);
    showNotification('Network error loading stats', 'error');
  }
}
```

---

## Summary of Changes

| Function | Old Endpoint | New Endpoint | Changes |
|----------|--------------|--------------|---------|
| `loadOrders()` | `/api/admin/orders` | `/api/admin/orders-secure` | ✅ 3 error checks, use `result.data` |
| `approveOrder()` | `/api/admin/orders/approve` | `/api/admin/orders/approve-secure` | ✅ 2 error checks, use `showNotification` |
| `rejectOrder()` | `/api/admin/orders/reject` | `/api/admin/orders/reject-secure` | ✅ 2 error checks, add reason, use `showNotification` |
| `updateStats()` | `/api/admin/orders` | `/api/admin/stats` | ✅ 2 error checks, use new stats object |

---

## Key Changes Made

### 1. Error Handling Pattern
```javascript
// OLD: No error handling
const response = await fetch('/api/admin/orders');
const orders = await response.json();
console.log(orders);  // Hides silent failures

// NEW: Proper error handling
const response = await fetch('/api/admin/orders-secure');
if (!response.ok) {
  const error = await response.json();
  console.error('Failed:', error);
  showNotification(error.error, 'error');
  return;
}
const result = await response.json();
if (!result.success) {
  console.error('Error:', result);
  showNotification(result.error, 'error');
  return;
}
// Now safe to use result.data
```

### 2. Response Structure
```javascript
// OLD response
[order1, order2, order3]

// NEW response
{
  success: true,
  data: [order1, order2, order3],
  count: 3,
  meta: { admin_email: "..." }
}
```

### 3. Endpoint Names
- `/api/admin/orders` → `/api/admin/orders-secure`
- `/api/admin/orders/approve` → `/api/admin/orders/approve-secure`
- `/api/admin/orders/reject` → `/api/admin/orders/reject-secure`
- (new) `/api/admin/stats`

### 4. Notification Pattern
```javascript
// OLD
alert('Order approved!');

// NEW
showNotification('Order approved!', 'success');  // Has timeout, appears as toast
showNotification('Error message', 'error');      // Shows in red
```

---

## Testing Changes

After making these changes, test:

### 1. Load Orders
```javascript
// In browser console
fetch('/api/admin/orders-secure')
  .then(r => r.json())
  .then(d => console.log(d));
  
// Should show:
// { success: true, data: [...], count: 3 }
```

### 2. Approve Order
```javascript
fetch('/api/admin/orders/approve-secure', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ orderId: 'order-uuid' })
})
  .then(r => r.json())
  .then(d => console.log(d));

// Should show:
// { success: true, message: "Order approved...", data: {...} }
```

### 3. Reject Order
```javascript
fetch('/api/admin/orders/reject-secure', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    orderId: 'order-uuid',
    reason: 'Not feasible'
  })
})
  .then(r => r.json())
  .then(d => console.log(d));

// Should show:
// { success: true, message: "Order rejected...", data: {...} }
```

---

## No Other Changes Needed

Your admin.astro file already has:
- ✅ Server-side auth check (correct)
- ✅ is_admin verification (correct)
- ✅ Proper page redirect (correct)
- ✅ All UI/CSS (no changes)
- ✅ File upload functionality (no changes)
- ✅ Portfolio files management (no changes)
- ✅ Modal previews (no changes)

**Only the 4 fetch functions above need changes.**

---

## Line-by-Line Comparison

### Before updateStats()
```javascript
const ordersResponse = await fetch('/api/admin/orders');
const orders = await ordersResponse.json();
document.getElementById('totalOrders').textContent = orders.length;
```

### After updateStats()
```javascript
const response = await fetch('/api/admin/stats');
if (!response.ok) {
  const error = await response.json();
  console.error('Stats error:', error);
  showNotification(`Failed to load stats: ${error.error}`, 'error');
  return;
}
const result = await response.json();
if (!result.success) {
  console.error('Stats query failed:', result);
  showNotification(`Error: ${result.error}`, 'error');
  return;
}
const stats = result.data;
document.getElementById('totalOrders').textContent = stats.total_orders || 0;
```

---

## Migration Checklist

- [ ] Located all 4 functions in admin.astro
- [ ] Copied old code to safe location (backup)
- [ ] Updated `loadOrders()` function
- [ ] Updated `approveOrder()` function
- [ ] Updated `rejectOrder()` function
- [ ] Updated `updateStats()` function
- [ ] Created 4 new API endpoint files
- [ ] Tested in browser console (all endpoints return success)
- [ ] Verified `/admin` page loads
- [ ] Verified approve works
- [ ] Verified reject works
- [ ] Checked DevTools Network tab (success responses)
- [ ] Checked browser console (no red errors)
- [ ] Ready to deploy ✅

