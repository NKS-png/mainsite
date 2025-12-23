// Cart System Frontend JavaScript
class CartManager {
    constructor(apiBaseUrl = '/cart-api') {
        this.apiBaseUrl = apiBaseUrl;
        this.cart = null;
        this.listeners = [];
    }

    // Subscribe to cart changes
    onChange(callback) {
        this.listeners.push(callback);
    }

    // Notify listeners of cart changes
    notifyListeners() {
        this.listeners.forEach(callback => callback(this.cart));
    }

    // Load cart from server
    async loadCart() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/cart.php`);
            this.cart = await response.json();
            this.notifyListeners();
            return this.cart;
        } catch (error) {
            console.error('Failed to load cart:', error);
            return null;
        }
    }

    // Add item to cart
    async addItem(item) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/cart.php?action=add_item`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
            const result = await response.json();
            if (result.success) {
                await this.loadCart(); // Refresh cart
                this.showNotification('Item added to cart!');
            }
            return result;
        } catch (error) {
            console.error('Failed to add item:', error);
            return { error: error.message };
        }
    }

    // Update item quantity
    async updateItem(itemId, qty) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/cart.php?action=update_item`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: itemId, qty: qty })
            });
            const result = await response.json();
            if (result.success) {
                await this.loadCart();
            }
            return result;
        } catch (error) {
            console.error('Failed to update item:', error);
            return { error: error.message };
        }
    }

    // Remove item from cart
    async removeItem(itemId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/cart.php?action=remove_item&item_id=${itemId}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            if (result.success) {
                await this.loadCart();
                this.showNotification('Item removed from cart');
            }
            return result;
        } catch (error) {
            console.error('Failed to remove item:', error);
            return { error: error.message };
        }
    }

    // Apply coupon
    async applyCoupon(code) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/cart.php?action=apply_coupon`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code })
            });
            const result = await response.json();
            if (result.success) {
                await this.loadCart();
                this.showNotification(`Coupon applied! Saved ₹${result.discount}`);
            }
            return result;
        } catch (error) {
            console.error('Failed to apply coupon:', error);
            return { error: error.message };
        }
    }

    // Clear cart
    async clearCart() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/cart.php?action=clear_cart`, {
                method: 'DELETE'
            });
            const result = await response.json();
            if (result.success) {
                await this.loadCart();
                this.showNotification('Cart cleared');
            }
            return result;
        } catch (error) {
            console.error('Failed to clear cart:', error);
            return { error: error.message };
        }
    }

    // Get cart summary
    getCartSummary() {
        if (!this.cart) return { itemCount: 0, subtotal: 0, total: 0 };

        return {
            itemCount: this.cart.cart_items?.length || 0,
            subtotal: this.cart.subtotal || 0,
            discount: this.cart.discount || 0,
            total: this.cart.total || 0
        };
    }

    // Show notification (implement based on your UI framework)
    showNotification(message) {
        // Simple browser alert - replace with your notification system
        alert(message);

        // Or dispatch custom event for your UI to handle
        window.dispatchEvent(new CustomEvent('cart-notification', {
            detail: { message }
        }));
    }
}

// Initialize cart manager
const cartManager = new CartManager();

// Quick add to cart functions
function addPackageToCart(productId, title, price, qty = 1) {
    return cartManager.addItem({
        item_type: 'package',
        item_id: productId,
        title: title,
        unit_price: price,
        qty: qty
    });
}

function addSubscriptionToCart(planId, title, price, options = {}) {
    return cartManager.addItem({
        item_type: 'subscription',
        item_id: planId,
        title: title,
        unit_price: price,
        qty: 1,
        options: options
    });
}

function addSpecialRequestToCart(title, description, price, referenceFiles = []) {
    return cartManager.addItem({
        item_type: 'special_request',
        item_id: 'custom_' + Date.now(),
        title: title,
        description: description,
        unit_price: price,
        qty: 1,
        reference_files: referenceFiles
    });
}

// Export for use in other scripts
window.CartManager = CartManager;
window.cartManager = cartManager;
window.addPackageToCart = addPackageToCart;
window.addSubscriptionToCart = addSubscriptionToCart;
window.addSpecialRequestToCart = addSpecialRequestToCart;