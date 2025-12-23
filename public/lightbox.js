// Immersive Lightbox for Artwork Viewing
class LightboxController {
    constructor() {
        this.currentIndex = 0;
        this.items = [];
        this.isOpen = false;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPortfolioItems();
    }

    setupEventListeners() {
        // Portfolio items are not clickable - no lightbox

        // Lightbox controls
        const closeBtn = document.getElementById('lightboxClose');
        const prevBtn = document.getElementById('lightboxPrev');
        const nextBtn = document.getElementById('lightboxNext');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeLightbox());
            closeBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.closeLightbox();
                }
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.showPrevious());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.showNext());
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;

            switch (e.key) {
                case 'Escape':
                    this.closeLightbox();
                    break;
                case 'ArrowLeft':
                    this.showPrevious();
                    break;
                case 'ArrowRight':
                    this.showNext();
                    break;
            }
        });

        // Touch/swipe support
        const overlay = document.getElementById('lightboxOverlay');
        if (overlay) {
            overlay.addEventListener('touchstart', (e) => {
                this.touchStartX = e.touches[0].clientX;
                this.touchStartY = e.touches[0].clientY;
            });

            overlay.addEventListener('touchend', (e) => {
                if (!this.touchStartX || !this.touchStartY) return;

                const touchEndX = e.changedTouches[0].clientX;
                const touchEndY = e.changedTouches[0].clientY;
                const deltaX = touchEndX - this.touchStartX;
                const deltaY = touchEndY - this.touchStartY;

                // Only handle horizontal swipes
                if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                    if (deltaX > 0) {
                        this.showPrevious();
                    } else {
                        this.showNext();
                    }
                }

                this.touchStartX = 0;
                this.touchStartY = 0;
            });
        }

        // CTA button
        const ctaBtn = document.getElementById('lightboxCTA');
        if (ctaBtn) {
            ctaBtn.addEventListener('click', () => this.handleCTA());
        }

        // Share button
        const shareBtn = document.getElementById('lightboxShare');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.handleShare());
        }
    }

    loadPortfolioItems() {
        // Load portfolio items from the page
        const portfolioItems = document.querySelectorAll('.portfolio-item');
        this.items = Array.from(portfolioItems).map(item => ({
            id: item.dataset.id || '',
            title: item.querySelector('.portfolio-title')?.textContent || '',
            category: item.querySelector('.portfolio-category')?.textContent || '',
            image: item.querySelector('.portfolio-image')?.src || '',
            description: item.dataset.description || '',
            date: item.dataset.date || '',
            tags: item.dataset.tags ? item.dataset.tags.split(',') : []
        }));
    }

    openLightbox(index) {
        this.currentIndex = index;
        this.isOpen = true;

        const overlay = document.getElementById('lightboxOverlay');
        if (overlay) {
            overlay.classList.add('active');
            this.updateLightboxContent();
            this.updateNavigationButtons();

            // Animate opening
            if (typeof animationController !== 'undefined') {
                animationController.animateModalOpen(overlay);
            }

            // Focus management
            overlay.focus();
            document.body.style.overflow = 'hidden';
        }
    }

    closeLightbox() {
        this.isOpen = false;

        const overlay = document.getElementById('lightboxOverlay');
        if (overlay) {
            if (typeof animationController !== 'undefined') {
                animationController.animateModalClose(overlay);
            } else {
                overlay.classList.remove('active');
            }

            document.body.style.overflow = '';
        }
    }

    showPrevious() {
        if (this.items.length === 0) return;
        this.currentIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;
        this.updateLightboxContent();
        this.updateNavigationButtons();
    }

    showNext() {
        if (this.items.length === 0) return;
        this.currentIndex = (this.currentIndex + 1) % this.items.length;
        this.updateLightboxContent();
        this.updateNavigationButtons();
    }

    updateLightboxContent() {
        const item = this.items[this.currentIndex];
        if (!item) return;

        const mediaContainer = document.getElementById('lightboxMedia');
        const titleEl = document.getElementById('lightboxTitle');
        const descriptionEl = document.getElementById('lightboxDescription');
        const categoryEl = document.getElementById('lightboxCategory');
        const dateEl = document.getElementById('lightboxDate');

        if (mediaContainer) {
            // Clear previous content
            mediaContainer.innerHTML = '';

            // Create new media element
            let mediaElement;

            if (this.isVideo(item.image)) {
                mediaElement = document.createElement('video');
                mediaElement.src = item.image;
                mediaElement.controls = true;
                mediaElement.preload = 'metadata';
                mediaElement.style.maxWidth = '100%';
                mediaElement.style.maxHeight = '100%';
            } else {
                mediaElement = document.createElement('img');
                mediaElement.src = item.image;
                mediaElement.alt = item.title;
                mediaElement.loading = 'lazy';

                // Progressive loading effect
                mediaElement.style.opacity = '0';
                mediaElement.onload = () => {
                    gsap.to(mediaElement, {
                        opacity: 1,
                        duration: 0.5,
                        ease: "power2.out"
                    });
                };
            }

            mediaContainer.appendChild(mediaElement);
        }

        // Show only category name, hide description and date
        if (titleEl) titleEl.textContent = item.category; // Show category instead of title
        if (descriptionEl) descriptionEl.textContent = ''; // No description
        if (categoryEl) categoryEl.textContent = ''; // Hide category since it's now in title
        if (dateEl) dateEl.textContent = ''; // No date

        // Update document title for accessibility
        document.title = `${item.category} - Lightbox View`;
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('lightboxPrev');
        const nextBtn = document.getElementById('lightboxNext');

        if (prevBtn) {
            prevBtn.style.opacity = this.items.length > 1 ? '1' : '0.5';
            prevBtn.disabled = this.items.length <= 1;
        }

        if (nextBtn) {
            nextBtn.style.opacity = this.items.length > 1 ? '1' : '0.5';
            nextBtn.disabled = this.items.length <= 1;
        }
    }

    isVideo(filename) {
        const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov'];
        return videoExtensions.some(ext => filename.toLowerCase().includes(ext));
    }

    handleCTA() {
        const item = this.items[this.currentIndex];
        if (item) {
            // Add to cart or request similar
            if (typeof cartManager !== 'undefined') {
                cartManager.addPackage('custom_' + Date.now(), `Custom ${item.title}`, 0);
                this.showNotification('Request submitted! Our team will contact you soon.');
            }
            this.closeLightbox();
        }
    }

    handleShare() {
        const item = this.items[this.currentIndex];
        if (item && navigator.share) {
            navigator.share({
                title: item.title,
                text: item.description,
                url: window.location.href
            });
        } else {
            // Fallback: copy URL to clipboard
            navigator.clipboard.writeText(window.location.href).then(() => {
                this.showNotification('Link copied to clipboard!');
            });
        }
    }

    showNotification(message) {
        if (typeof animationController !== 'undefined') {
            animationController.animateNotification({
                textContent: message,
                style: {
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    background: '#10b981',
                    color: 'white',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    zIndex: '9999'
                }
            });
        } else {
            // Simple notification fallback
            const notification = document.createElement('div');
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #10b981;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                z-index: 9999;
            `;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        }
    }

    // Accessibility methods
    updateAriaLabels() {
        const overlay = document.getElementById('lightboxOverlay');
        if (overlay) {
            overlay.setAttribute('aria-hidden', !this.isOpen);
            overlay.setAttribute('aria-label', `Image ${this.currentIndex + 1} of ${this.items.length}`);
        }
    }

    // Keyboard navigation trap
    trapFocus(container) {
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        container.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        });
    }

    // Performance optimizations
    preloadAdjacentImages() {
        const preloadIndices = [
            (this.currentIndex - 1 + this.items.length) % this.items.length,
            (this.currentIndex + 1) % this.items.length
        ];

        preloadIndices.forEach(index => {
            const item = this.items[index];
            if (item && !this.isVideo(item.image)) {
                const img = new Image();
                img.src = item.image;
            }
        });
    }

    // Analytics tracking
    trackLightboxEvent(action, item) {
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                event_category: 'lightbox',
                event_label: item.title,
                value: this.currentIndex + 1
            });
        }
    }
}

// Global lightbox controller
const lightboxController = new LightboxController();

// Export for global use
window.LightboxController = LightboxController;
window.lightboxController = lightboxController;