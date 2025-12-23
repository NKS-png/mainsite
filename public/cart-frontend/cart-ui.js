// Cart UI Management
let currentCart = null;

// Initialize cart UI
document.addEventListener('DOMContentLoaded', function() {
    cartManager.onChange(updateCartUI);
    cartManager.loadCart();

    // Set up event listeners
    setupCartEventListeners();
});

function setupCartEventListeners() {
    // Cart icon click
    const cartIcon = document.getElementById('cart-icon');
    if (cartIcon) {
        cartIcon.addEventListener('click', toggleMiniCart);
    }

    // Coupon application
    const couponBtn = document.querySelector('button[onclick="applyCoupon()"]');
    if (couponBtn) {
        couponBtn.addEventListener('click', () => {
            const code = document.getElementById('coupon-code').value;
            if (code) applyCoupon(code);
        });
    }

    // Special request form
    const specialRequestForm = document.getElementById('special-request-form');
    if (specialRequestForm) {
        specialRequestForm.addEventListener('submit', handleSpecialRequest);
    }

    // File upload preview
    const fileInput = document.getElementById('reference-files');
    if (fileInput) {
        fileInput.addEventListener('change', previewFiles);
    }
}

function updateCartUI(cart) {
    currentCart = cart;
    updateCartIcon();
    updateMiniCart();
    updateCartPage();
    updateCheckoutPage();
}

function updateCartIcon() {
    const cartCount = document.getElementById('cart-count');
    if (cartCount && currentCart) {
        const summary = cartManager.getCartSummary();
        cartCount.textContent = summary.itemCount;
        cartCount.style.display = summary.itemCount > 0 ? 'block' : 'none';
    }
}

function toggleMiniCart() {
    const miniCart = document.getElementById('mini-cart');
    if (miniCart) {
        miniCart.classList.toggle('hidden');
    }
}

function updateMiniCart() {
    const container = document.getElementById('mini-cart-items');
    const totalEl = document.getElementById('cart-total');

    if (!container || !currentCart) return;

    if (currentCart.cart_items && currentCart.cart_items.length > 0) {
        container.innerHTML = currentCart.cart_items.map(item => `
            <div class="mini-cart-item">
                <div class="item-info">
                    <span class="item-title">${item.title}</span>
                    <span class="item-price">₹${item.unit_price} × ${item.qty}</span>
                </div>
                <button onclick="cartManager.removeItem('${item.id}')">×</button>
            </div>
        `).join('');

        if (totalEl) {
            totalEl.textContent = currentCart.total || 0;
        }
    } else {
        container.innerHTML = '<p>Your cart is empty</p>';
        if (totalEl) totalEl.textContent = '0';
    }
}

function updateCartPage() {
    const container = document.getElementById('cart-items');
    if (!container || !currentCart) return;

    if (currentCart.cart_items && currentCart.cart_items.length > 0) {
        container.innerHTML = currentCart.cart_items.map(item => `
            <div class="cart-item">
                <div class="item-details">
                    <h4>${item.title}</h4>
                    <p>${item.description || ''}</p>
                    ${item.options ? `<p>Options: ${JSON.stringify(item.options)}</p>` : ''}
                    ${item.reference_files && item.reference_files.length ?
                        `<p>Reference files: ${item.reference_files.length} uploaded</p>` : ''}
                </div>
                <div class="item-controls">
                    <div class="quantity-controls">
                        <button onclick="changeQuantity('${item.id}', ${item.qty - 1})">-</button>
                        <span>${item.qty}</span>
                        <button onclick="changeQuantity('${item.id}', ${item.qty + 1})">+</button>
                    </div>
                    <div class="item-price">₹${item.line_total}</div>
                    <button onclick="cartManager.removeItem('${item.id}')" class="remove-btn">Remove</button>
                </div>
            </div>
        `).join('');
    } else {
        container.innerHTML = '<p>Your cart is empty</p>';
    }

    // Update summary
    updateCartSummary();
}

function updateCartSummary() {
    const subtotalEl = document.getElementById('summary-subtotal');
    const discountEl = document.getElementById('summary-discount');
    const totalEl = document.getElementById('summary-total');
    const discountRow = document.getElementById('discount-row');

    if (currentCart) {
        if (subtotalEl) subtotalEl.textContent = currentCart.subtotal || 0;
        if (totalEl) totalEl.textContent = currentCart.total || 0;

        if (currentCart.discount > 0) {
            if (discountEl) discountEl.textContent = currentCart.discount;
            if (discountRow) discountRow.style.display = 'flex';
        } else {
            if (discountRow) discountRow.style.display = 'none';
        }
    }
}

function updateCheckoutPage() {
    const container = document.getElementById('checkout-items-list');
    if (!container || !currentCart) return;

    if (currentCart.cart_items && currentCart.cart_items.length > 0) {
        container.innerHTML = currentCart.cart_items.map(item => `
            <div class="checkout-item">
                <span>${item.title} × ${item.qty}</span>
                <span>₹${item.line_total}</span>
            </div>
        `).join('');

        // Add totals
        container.innerHTML += `
            <div class="checkout-total">
                <div class="total-row">
                    <span>Subtotal:</span>
                    <span>₹${currentCart.subtotal}</span>
                </div>
                ${currentCart.discount > 0 ? `
                <div class="total-row">
                    <span>Discount:</span>
                    <span>-₹${currentCart.discount}</span>
                </div>` : ''}
                <div class="total-row final-total">
                    <span>Total:</span>
                    <span>₹${currentCart.total}</span>
                </div>
            </div>
        `;
    }
}

async function changeQuantity(itemId, newQty) {
    if (newQty < 1) return;
    await cartManager.updateItem(itemId, newQty);
}

async function applyCoupon(code) {
    await cartManager.applyCoupon(code);
}

function proceedToCheckout() {
    window.location.href = '/checkout';
}

async function initiatePayment() {
    const payBtn = document.getElementById('pay-btn');
    if (payBtn) payBtn.disabled = true;

    try {
        // Get contact details
        const contact = {
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            name: document.getElementById('name').value,
            notes: document.getElementById('notes').value
        };

        // Create Razorpay order
        const response = await fetch('/cart-api/checkout.php?action=create_order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contact })
        });

        const orderData = await response.json();

        if (orderData.error) {
            alert('Error creating order: ' + orderData.error);
            return;
        }

        // Initialize Razorpay
        const options = {
            key: 'YOUR_RAZORPAY_KEY_ID', // Replace with your key
            amount: orderData.amount,
            currency: orderData.currency,
            order_id: orderData.order_id,
            name: 'Your Company Name',
            description: 'Purchase Description',
            handler: function(response) {
                // Payment successful
                completeCheckout(response, contact);
            },
            prefill: {
                email: contact.email,
                contact: contact.phone,
                name: contact.name
            },
            theme: {
                color: '#007bff'
            }
        };

        const rzp = new Razorpay(options);
        rzp.open();

    } catch (error) {
        alert('Payment initialization failed: ' + error.message);
    } finally {
        if (payBtn) payBtn.disabled = false;
    }
}

async function completeCheckout(paymentResponse, contactDetails) {
    try {
        const response = await fetch('/cart-api/checkout.php?action=complete_checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                payment_id: paymentResponse.razorpay_payment_id,
                order_id: paymentResponse.razorpay_order_id,
                contact: contactDetails
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('Order completed successfully!');
            window.location.href = '/order-success?order_id=' + result.order_id;
        } else {
            alert('Order completion failed: ' + result.error);
        }
    } catch (error) {
        alert('Order completion error: ' + error.message);
    }
}

// Special request modal functions
function openSpecialRequestModal() {
    document.getElementById('special-request-modal').style.display = 'block';
}

function closeSpecialRequestModal() {
    document.getElementById('special-request-modal').style.display = 'none';
}

async function handleSpecialRequest(e) {
    e.preventDefault();

    const title = document.getElementById('request-title').value;
    const description = document.getElementById('request-description').value;
    const budget = parseFloat(document.getElementById('request-budget').value);

    if (!title || !description || !budget) {
        alert('Please fill all required fields');
        return;
    }

    // Upload files first if any
    let referenceFiles = [];
    const fileInput = document.getElementById('reference-files');
    if (fileInput.files.length > 0) {
        const formData = new FormData();
        for (let i = 0; i < fileInput.files.length; i++) {
            formData.append(`reference_file_${i}`, fileInput.files[i]);
        }

        try {
            const uploadResponse = await fetch('/cart-api/upload.php', {
                method: 'POST',
                body: formData
            });
            const uploadResult = await uploadResponse.json();

            if (uploadResult.success) {
                referenceFiles = uploadResult.files.map(f => f.url);
            }
        } catch (error) {
            alert('File upload failed: ' + error.message);
            return;
        }
    }

    // Add to cart
    const result = await addSpecialRequestToCart(title, description, budget, referenceFiles);

    if (result.success) {
        closeSpecialRequestModal();
        document.getElementById('special-request-form').reset();
        document.getElementById('file-preview').innerHTML = '';
    } else {
        alert('Failed to add to cart: ' + (result.error || 'Unknown error'));
    }
}

function previewFiles(e) {
    const files = e.target.files;
    const preview = document.getElementById('file-preview');

    preview.innerHTML = '';

    for (let file of files) {
        const item = document.createElement('div');
        item.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
        preview.appendChild(item);
    }
}

// Make functions globally available
window.toggleMiniCart = toggleMiniCart;
window.applyCoupon = applyCoupon;
window.proceedToCheckout = proceedToCheckout;
window.initiatePayment = initiatePayment;
window.changeQuantity = changeQuantity;
window.openSpecialRequestModal = openSpecialRequestModal;
window.closeSpecialRequestModal = closeSpecialRequestModal;