# Cart Frontend Components

JavaScript and HTML components for the shopping cart system.

## Files

- `cart.js` - Core cart management class
- `cart-ui.js` - UI interaction handlers
- `cart-ui.html` - HTML templates for cart components
- `cart.css` - Styling for cart components

## Setup

1. Include the CSS in your HTML head:
```html
<link rel="stylesheet" href="/cart-frontend/cart.css">
```

2. Include the JavaScript files before closing body tag:
```html
<script src="/cart-frontend/cart.js"></script>
<script src="/cart-frontend/cart-ui.js"></script>
```

3. Add cart HTML components to your page where needed.

## Usage Examples

### Add to Cart Buttons

```html
<!-- Package -->
<button onclick="addPackageToCart('prod_123', 'Basic Video Edit', 5000)">
    Add Package - ₹5000
</button>

<!-- Subscription -->
<button onclick="addSubscriptionToCart('plan_456', 'Monthly Service', 15000, {duration: '1 month'})">
    Add Subscription - ₹15000/month
</button>

<!-- Special Request -->
<button onclick="openSpecialRequestModal()">
    Request Custom Service
</button>
```

### Cart Icon in Header

```html
<div id="cart-icon" class="cart-icon">
    <span class="cart-count" id="cart-count">0</span>
    🛒
</div>
```

### Full Cart Page

```html
<div class="cart-page">
    <h1>Shopping Cart</h1>
    <div id="cart-items" class="cart-items"></div>
    <div class="cart-summary">
        <input type="text" id="coupon-code" placeholder="Coupon code">
        <button onclick="applyCoupon()">Apply</button>
        <div id="cart-summary"></div>
        <button onclick="proceedToCheckout()">Checkout</button>
    </div>
</div>
```

## API Integration

Update the API base URL in `cart.js`:

```javascript
const cartManager = new CartManager('/your-api-path');
```

## Customization

### Styling
Modify `cart.css` to match your site's design.

### Notifications
Replace the simple `alert()` calls with your notification system:

```javascript
// In cart.js, replace:
this.showNotification = function(message) {
    // Your custom notification logic
    showToast(message);
};
```

### Payment Integration
Update the Razorpay key in `cart-ui.js`:

```javascript
const options = {
    key: 'YOUR_RAZORPAY_KEY_ID', // Replace with your key
    // ... rest of options
};
```

## Cart States

- **Guest Cart**: Uses session cookie for anonymous users
- **User Cart**: Linked to authenticated user account
- **Merged Cart**: Guest cart items move to user cart on login

## Security Notes

- All cart operations validate data server-side
- File uploads are validated for type and size
- Payment verification happens server-side
- Sensitive data never stored in local storage

## Browser Support

- Modern browsers with ES6 support
- File upload requires modern File API
- Payment integration requires Razorpay JS SDK