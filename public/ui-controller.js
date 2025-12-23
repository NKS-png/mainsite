// UI Controller - Handles general UI interactions and state management
class UIController {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        this.applyTheme();
        this.setupResponsive();
        this.setupAccessibility();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', this.currentTheme);
        this.applyTheme();

        // Animate theme transition
        if (typeof gsap !== 'undefined') {
            gsap.to('body', {
                backgroundColor: this.currentTheme === 'dark' ? '#111827' : '#ffffff',
                duration: 0.3
            });
        }
    }

    setupResponsive() {
        // Handle viewport height for mobile browsers
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', setVH);
    }

    setupAccessibility() {
        // Skip to main content link
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link sr-only';
        skipLink.textContent = 'Skip to main content';
        document.body.insertBefore(skipLink, document.body.firstChild);

        // Focus management
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });

        // Reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            document.documentElement.style.setProperty('--animation-duration', '0.01ms');
        }
    }

    // Utility functions
    scrollToSection(sectionId) {
        const element = document.querySelector(sectionId);
        if (element) {
            const offset = 80; // Header height
            const elementPosition = element.offsetTop - offset;

            window.scrollTo({
                top: elementPosition,
                behavior: 'smooth'
            });
        }
    }

    showModal(content, options = {}) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                <div class="modal-body">${content}</div>
            </div>
        `;

        document.body.appendChild(modal);

        // Animate modal
        if (typeof animationController !== 'undefined') {
            animationController.animateModalOpen(modal.querySelector('.modal-content'));
        }

        // Auto remove after timeout if specified
        if (options.timeout) {
            setTimeout(() => {
                if (typeof animationController !== 'undefined') {
                    animationController.animateModalClose(modal.querySelector('.modal-content'));
                    setTimeout(() => modal.remove(), 300);
                } else {
                    modal.remove();
                }
            }, options.timeout);
        }

        return modal;
    }

    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Add to toast container or create one
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        container.appendChild(toast);

        // Animate toast
        if (typeof animationController !== 'undefined') {
            animationController.animateNotification(toast);
        }

        // Auto remove
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);

        return toast;
    }

    // Loading states
    showLoading(element, text = 'Loading...') {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (element) {
            element.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <span>${text}</span>
                </div>
            `;
            element.classList.add('loading');
        }
    }

    hideLoading(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (element) {
            element.classList.remove('loading');
        }
    }

    // Form validation
    validateForm(form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        let isValid = true;

        inputs.forEach(input => {
            if (input.hasAttribute('required') && !input.value.trim()) {
                this.showFieldError(input, 'This field is required');
                isValid = false;
            } else if (input.type === 'email' && input.value && !this.isValidEmail(input.value)) {
                this.showFieldError(input, 'Please enter a valid email address');
                isValid = false;
            } else {
                this.clearFieldError(input);
            }
        });

        return isValid;
    }

    showFieldError(input, message) {
        this.clearFieldError(input);

        input.classList.add('error');
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;

        input.parentElement.appendChild(errorElement);
    }

    clearFieldError(input) {
        input.classList.remove('error');
        const errorElement = input.parentElement.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Debounce utility
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle utility
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Global UI controller
const uiController = new UIController();

// Export for global use
window.UIController = UIController;
window.uiController = uiController;