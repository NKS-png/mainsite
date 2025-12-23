// Cart Manager - Handles shopping cart functionality
class CartManager {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.init();
    }

    init() {
        this.updateCartUI();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Profile/Cart icon click
        const profileCartIcon = document.getElementById('profileCartIcon');
        if (profileCartIcon) {
            profileCartIcon.addEventListener('click', () => this.toggleCartPanel());
        }

        // Close cart panel
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.slideout-panel') && !e.target.closest('#profileCartIcon')) {
                this.closeCartPanel();
            }
        });
    }

    addPackage(productId, title, price) {
        const existingItem = this.cart.find(item => item.id === productId);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                id: productId,
                title: title,
                price: parseFloat(price.replace('₹', '').replace(',', '')),
                quantity: 1
            });
        }

        this.saveCart();
        this.updateCartUI();
        this.showNotification(`${title} added to cart!`, 'success');

        // Animate button
        if (typeof animationController !== 'undefined') {
            const button = event.target;
            animationController.animateButtonClick(button);
        }
    }

    removeItem(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartUI();
    }

    updateQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            item.quantity = Math.max(0, quantity);
            if (item.quantity === 0) {
                this.removeItem(productId);
            } else {
                this.saveCart();
                this.updateCartUI();
            }
        }
    }

    getTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getItemCount() {
        return this.cart.reduce((count, item) => count + item.quantity, 0);
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    updateCartUI() {
        this.updateCartBadge();
        this.renderCartPanel();
    }

    updateCartBadge() {
        const badge = document.getElementById('notificationBadge');
        const count = document.getElementById('notificationCount');
        const itemCount = this.getItemCount();

        if (badge && count) {
            if (itemCount > 0) {
                badge.style.display = 'flex';
                count.textContent = itemCount > 99 ? '99+' : itemCount;
            } else {
                badge.style.display = 'none';
            }
        }
    }

    renderCartPanel() {
        const panel = document.getElementById('slideoutPanel');
        if (!panel) return;

        const content = panel.querySelector('.slideout-content');
        if (!content) return;

        if (this.cart.length === 0) {
            content.innerHTML = `
                <div class="cart-header">
                    <h3>Shopping Cart</h3>
                    <button onclick="cartManager.closeCartPanel()">×</button>
                </div>
                <div class="cart-empty">
                    <div>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 3h18l-1 16H4L3 3z" stroke="currentColor" stroke-width="2"/>
                            <path d="M8 3V1a1 1 0 011-1h6a1 1 0 011 1v2M9 11v6M12 11v6M15 11v6" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </div>
                    <p>Your cart is empty</p>
                    <button onclick="cartManager.closeCartPanel(); scrollToSection('store')" class="cta-secondary">Browse Services</button>
                </div>
            `;
        } else {
            const total = this.getTotal();
            content.innerHTML = `
                <div class="cart-header">
                    <h3>Shopping Cart (${this.getItemCount()} items)</h3>
                    <button onclick="cartManager.closeCartPanel()">×</button>
                </div>
                <div class="cart-items">
                    ${this.cart.map(item => `
                        <div class="cart-item">
                            <div class="cart-item-info">
                                <h4>${item.title}</h4>
                                <div class="cart-item-price">₹${item.price.toLocaleString()}</div>
                            </div>
                            <div class="cart-item-controls">
                                <button onclick="cartManager.updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                                <span>${item.quantity}</span>
                                <button onclick="cartManager.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                                <button onclick="cartManager.removeItem('${item.id}')" class="remove-btn">×</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="cart-footer">
                    <div class="cart-total">
                        <span>Total: ₹${total.toLocaleString()}</span>
                    </div>
                    <button onclick="cartManager.checkout()" class="cta-primary">Proceed to Checkout</button>
                </div>
            `;
        }
    }

    toggleCartPanel() {
        const panel = document.getElementById('slideoutPanel');
        if (panel) {
            const isOpen = panel.classList.contains('open');
            if (isOpen) {
                this.closeCartPanel();
            } else {
                this.openCartPanel();
            }
        }
    }

    openCartPanel() {
        const panel = document.getElementById('slideoutPanel');
        if (panel) {
            panel.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    }

    closeCartPanel() {
        const panel = document.getElementById('slideoutPanel');
        if (panel) {
            panel.classList.remove('open');
            document.body.style.overflow = '';
        }
    }

    checkout() {
        // Implement checkout logic
        alert('Checkout functionality would be implemented here with payment integration');
    }

    async logout() {
        try {
            // Sign out from Supabase if available
            if (typeof supabase !== 'undefined') {
                const { error } = await supabase.auth.signOut();
                if (error) {
                    console.error('Logout error:', error);
                }
            }

            // Clear local data
            localStorage.removeItem('user');
            this.cart = [];
            localStorage.removeItem('cart');

            // Update UI
            this.updateAuthUI();
            this.updateAuthBasedUI();

            // Redirect to home
            window.location.href = '/';
        } catch (error) {
            console.error('Unexpected logout error:', error);
            // Fallback: clear local data anyway
            localStorage.removeItem('user');
            this.cart = [];
            localStorage.removeItem('cart');
            this.updateAuthUI();
            this.updateAuthBasedUI();
            window.location.href = '/';
        }
    }

    showNotification(message, type = 'info') {
        if (typeof animationController !== 'undefined') {
            animationController.animateNotification({
                textContent: message,
                className: `notification notification-${type}`
            });
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Global cart manager
const cartManager = new CartManager();

// Export for global use
window.CartManager = CartManager;
window.cartManager = cartManager;
