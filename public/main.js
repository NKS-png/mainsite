// Prevent double initialization
if (window.__portfolioInit) {
    console.log('portfolio renderer already initialized');
} else {
    window.__portfolioInit = true;

    // Main Application Controller
    class MainController {
        constructor() {
            this.portfolioItems = [];
            this.currentFilter = 'all';
            this.isLoading = false;
            this.init();
        }

        init() {
            this.setupEventListeners();
            this.loadPortfolioItems();
            this.setupScrollEffects();
            this.setupAuthUI();
            this.setupIntersectionObserver();
            // apply global tilt effect to images and videos
            this.setupGlobalTiltEffects();
        }

    // Show/hide auth buttons and profile menu across pages based on localStorage user
    setupAuthUI() {
        try {
            const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
            const authButtons = document.getElementById('authButtons');
            const userMenu = document.getElementById('userMenu');
            const adminBtn = document.getElementById('adminBtn');

            if (storedUser && (storedUser.email || storedUser.id)) {
                if (authButtons) authButtons.style.display = 'none';
                if (userMenu) userMenu.style.display = 'inline-flex';
                if (adminBtn) adminBtn.style.display = storedUser.isAdmin ? 'inline-block' : 'none';
            } else {
                if (authButtons) authButtons.style.display = 'flex';
                if (userMenu) userMenu.style.display = 'none';
                if (adminBtn) adminBtn.style.display = 'none';
            }
        } catch (e) {
            // ignore parsing errors and leave defaults
            console.warn('setupAuthUI failed to parse stored user', e);
        }

        // Keep UI in sync if localStorage changes in other tabs
        try {
            window.addEventListener('storage', () => {
                try { this.setupAuthUI(); } catch (e) {}
            });
        } catch (e) {}
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Navigation
        this.setupNavigation();

        // Portfolio filters
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                this.filterPortfolio(filter);
            });
        });


        // Window resize handling
        window.addEventListener('resize', () => this.handleResize());

        // Online/offline detection
        window.addEventListener('online', () => this.handleOnlineStatus(true));
        window.addEventListener('offline', () => this.handleOnlineStatus(false));
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('href');
                this.scrollToSection(target);
            });
        });

        // Update active nav on scroll
        window.addEventListener('scroll', () => this.updateActiveNav());
    }

    setupScrollEffects() {
        // Header scroll effect
        const header = document.querySelector('.site-header');
        let lastScrollY = window.scrollY;

        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }

            // Hide/show header on scroll (optional)
            if (currentScrollY > lastScrollY && currentScrollY > 200) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }

            lastScrollY = currentScrollY;
        });
    }

    setupIntersectionObserver() {
        // Lazy load images
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                }
            });
        }, { rootMargin: '50px' });

        // Observe all lazy images
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });

        // Animate elements on scroll
        const animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, { threshold: 0.1 });

        // Observe elements with animation classes
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            animationObserver.observe(el);
        });
    }

    /*
     * Attach tilt hover interactions to images and videos across the site.
     * Skips small UI icons and portfolio items (those are handled separately).
     */
    setupGlobalTiltEffects() {
        // Don't run on touch-capable devices
        if (('ontouchstart' in window) || navigator.maxTouchPoints > 0) return;

        const candidates = Array.from(document.querySelectorAll('img, video'));

        candidates.forEach((el) => {
            // skip already-handled portfolio items or elements explicitly opting out
            if (el.closest('.portfolio-item')) return;
            if (el.dataset.noTilt === 'true') return;

            const rect = el.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;

            // ignore tiny UI images/icons
            if (width < 80 || height < 80) return;

            // Mark as processed
            el.classList.add('tilt-target');
            el.dataset.tiltBound = 'true';

            // make sure the element is focusable for keyboard accessibility
            if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');

            function handleMove(e) {
                // prefer client coords relative to element
                const r = el.getBoundingClientRect();
                const xVal = (e.clientX !== undefined) ? (e.clientX - r.left) : (e.layerX || 0);
                const yVal = (e.clientY !== undefined) ? (e.clientY - r.top) : (e.layerY || 0);
                const yRotation = 12 * ((xVal - r.width / 2) / r.width);
                const xRotation = -12 * ((yVal - r.height / 2) / r.height);
                const transform = `perspective(500px) scale(1.04) rotateX(${xRotation}deg) rotateY(${yRotation}deg)`;
                el.style.transform = transform;
            }

            function reset() {
                el.style.transform = 'perspective(500px) scale(1) rotateX(0) rotateY(0)';
            }

            function down() {
                el.style.transform = 'perspective(500px) scale(0.95) rotateX(0) rotateY(0)';
            }

            function up() {
                el.style.transform = 'perspective(500px) scale(1.04) rotateX(0) rotateY(0)';
            }

            el.addEventListener('mousemove', handleMove);
            el.addEventListener('mouseout', reset);
            el.addEventListener('mouseleave', reset);
            el.addEventListener('mousedown', down);
            el.addEventListener('mouseup', up);

            // keyboard accessible activation (space/enter briefly scale)
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    el.style.transform = 'perspective(500px) scale(0.95) rotateX(0) rotateY(0)';
                    setTimeout(() => { el.style.transform = 'perspective(500px) scale(1.04) rotateX(0) rotateY(0)'; }, 150);
                }
            });
        });
    }

    async loadPortfolioItems() {
        this.showLoadingState();

        try {
            // Use real portfolio data from Supabase only.
            // Do NOT fall back to stock or mock images — if no Supabase data is available
            // the portfolio will remain empty and we show an error state so you can
            // ensure uploads exist in Supabase storage and the `uploads` table.
            if (window.portfolioData && window.portfolioData.length > 0) {
                // Defensive deduplication: remove duplicates by image URL
                const seen = new Set();
                const dedupedData = window.portfolioData.filter(item => {
                    const key = item.image || item.thumbnail || item.path || item.id;
                    if (!key) return true;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });

                console.log('Client dedupe: raw', window.portfolioData.length, 'unique', dedupedData.length);

                // Sort by category: animation, artwork, video
                this.portfolioItems = dedupedData.sort((a, b) => {
                    const categoryOrder = { 'animation': 1, 'artwork': 2, 'video': 3 };
                    return (categoryOrder[a.category] || 4) - (categoryOrder[b.category] || 4);
                });
            } else {
                console.warn('No Supabase portfolio data found. Portfolio will be empty.');
                this.portfolioItems = [];
                this.showErrorState();
                return;
            }
            this.renderPortfolioItems();
        } catch (error) {
            console.error('Failed to load portfolio:', error);
            this.showErrorState();
        } finally {
            this.hideLoadingState();
        }
    }

    showLoadingState() {
        const grid = document.getElementById('portfolioGrid');
        if (grid) {
            grid.innerHTML = '';
            // Add skeleton loaders
            for (let i = 0; i < 6; i++) {
                grid.innerHTML += `
                    <div class="portfolio-item skeleton">
                        <div class="skeleton-image"></div>
                        <div class="skeleton-overlay">
                            <div class="skeleton-title"></div>
                            <div class="skeleton-category"></div>
                        </div>
                    </div>
                `;
            }
        }
    }

    hideLoadingState() {
        const skeletons = document.querySelectorAll('.skeleton');
        skeletons.forEach(skeleton => {
            skeleton.style.opacity = '0';
            setTimeout(() => skeleton.remove(), 300);
        });
    }

    showErrorState() {
        const grid = document.getElementById('portfolioGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="error-state">
                    <h3>Failed to load portfolio</h3>
                    <p>Please try again later</p>
                    <button onclick="mainController.loadPortfolioItems()">Retry</button>
                </div>
            `;
        }
    }

    renderPortfolioItems(items = null) {
        const grid = document.getElementById('portfolioGrid');
        const projectNamesEl = document.getElementById('projectNames');
        if (!grid) return;

        const itemsToRender = items || this.portfolioItems;
        const filteredItems = this.filterItems(itemsToRender);

        // Update screen reader content with project names
        if (projectNamesEl) {
            projectNamesEl.textContent = `Portfolio items: ${filteredItems.map(item => item.title).join(', ')}`;
        }

        // Clear existing content
        grid.innerHTML = '';

        // Render each item with proper media handling (copied from animation page)
        filteredItems.forEach((item) => {
            const url = item.thumbnail;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'portfolio-item animate-on-scroll';
            itemDiv.setAttribute('tabindex', '0');
            itemDiv.setAttribute('role', 'button');
            itemDiv.setAttribute('aria-label', `View ${item.title}`);

            // Media container
            const mediaDiv = document.createElement('div');
            mediaDiv.style.cssText = `
                position: relative;
                width: 100%;
                height: 250px;
                border-radius: var(--radius-xl);
                overflow: hidden;
                background: var(--bg-secondary);
                display: flex;
                align-items: center;
                justify-content: center;
            `;

            // IMAGE
            if (item.mime?.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = url;
                img.alt = item.title;
                img.loading = 'lazy';
                img.style.cssText = `
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform var(--transition-normal);
                `;
                img.onerror = () => {
                    console.log('Image failed to load:', item.title);
                    mediaDiv.innerHTML = `
                        <div style="text-align: center; color: var(--text-secondary);">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 8px; opacity: 0.5;">
                                <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
                                <path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            <p style="margin: 0; font-size: var(--font-size-sm);">Image unavailable</p>
                        </div>
                    `;
                };
                mediaDiv.appendChild(img);
            }
            // VIDEO
            else if (item.mime?.startsWith('video/')) {
                const video = document.createElement('video');
                video.src = url;
                video.preload = 'metadata';
                video.muted = true;
                video.playsInline = true;
                video.autoplay = true;
                video.loop = true;
                video.style.cssText = `
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                `;
                video.onerror = () => {
                    console.log('Video failed to load:', item.title);
                    mediaDiv.innerHTML = `
                        <div style="text-align: center; color: var(--text-secondary);">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 8px; opacity: 0.5;">
                                <polygon points="23 7 16 12 23 17 23 7" stroke="currentColor" stroke-width="2"/>
                                <rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            <p style="margin: 0; font-size: var(--font-size-sm);">Video unavailable</p>
                        </div>
                    `;
                };
                mediaDiv.appendChild(video);

                // Videos autoplay in loop - no play button needed
            }

            itemDiv.appendChild(mediaDiv);

            // Overlay
            const overlay = document.createElement('div');
            overlay.className = 'portfolio-overlay';
            overlay.innerHTML = `
                <h3 class="portfolio-title">${item.title}</h3>
                <p class="portfolio-category">${item.category}</p>
            `;
            itemDiv.appendChild(overlay);

            // Portfolio items are not clickable - no lightbox

            grid.appendChild(itemDiv);
        });

        // Add enhanced hover effects
        this.addEnhancedHoverEffects();

        // Update lightbox items
        if (typeof lightboxController !== 'undefined') {
            lightboxController.loadPortfolioItems();
        }
    }

    addEnhancedHoverEffects() {
        const portfolioItems = document.querySelectorAll('.portfolio-item');

        portfolioItems.forEach((item, index) => {
            let isHovering = false;

            // Get dimensions for tilt effect
            const height = item.clientHeight;
            const width = item.clientWidth;

            // Create cursor glow element
            const cursorGlow = document.createElement('div');
            cursorGlow.className = 'cursor-glow';
            cursorGlow.style.cssText = `
                position: absolute;
                width: 100px;
                height: 100px;
                background: radial-gradient(circle, rgba(147, 51, 234, 0.4) 0%, rgba(147, 51, 234, 0.1) 50%, transparent 100%);
                border-radius: 50%;
                pointer-events: none;
                opacity: 0;
                z-index: 5;
                transition: opacity 0.3s ease;
            `;
            item.appendChild(cursorGlow);

            // 3D Tilt effect function
            function handleTilt(e) {
                const xVal = e.layerX;
                const yVal = e.layerY;

                const yRotation = 20 * ((xVal - width / 2) / width);
                const xRotation = -20 * ((yVal - height / 2) / height);

                const string = 'perspective(500px) scale(1.1) rotateX(' + xRotation + 'deg) rotateY(' + yRotation + 'deg)';
                item.style.transform = string;
            }

            // Reset tilt function
            function resetTilt() {
                item.style.transform = 'perspective(500px) scale(1) rotateX(0) rotateY(0)';
            }

            // Click effect functions
            function handleMousedown() {
                item.style.transform = 'perspective(500px) scale(0.9) rotateX(0) rotateY(0)';
            }

            function handleMouseup() {
                item.style.transform = 'perspective(500px) scale(1.1) rotateX(0) rotateY(0)';
            }

            // Enhanced hover animations with 3D tilt
            item.addEventListener('mouseenter', (e) => {
                isHovering = true;

                // Add tilt event listeners
                item.addEventListener('mousemove', handleTilt);
                item.addEventListener('mousedown', handleMousedown);
                item.addEventListener('mouseup', handleMouseup);

                if (typeof gsap !== 'undefined') {
                    // Add box shadow for depth
                    gsap.to(item, {
                        boxShadow: '0px 0px 30px rgba(0,0,0, 0.6)',
                        duration: 0.1
                    });

                    // Staggered text animation
                    const title = item.querySelector('.portfolio-title');
                    const category = item.querySelector('.portfolio-category');

                    if (title) {
                        gsap.fromTo(title,
                            { y: 30, opacity: 0 },
                            { y: 0, opacity: 1, duration: 0.5, delay: 0.1, ease: "back.out(1.7)" }
                        );
                    }

                    if (category) {
                        gsap.fromTo(category,
                            { y: 20, opacity: 0 },
                            { y: 0, opacity: 1, duration: 0.4, delay: 0.2, ease: "back.out(1.7)" }
                        );
                    }

                    // Show cursor glow
                    gsap.to(cursorGlow, {
                        opacity: 1,
                        duration: 0.3
                    });
                }
            });

            item.addEventListener('mousemove', (e) => {
                if (isHovering) {
                    const rect = item.getBoundingClientRect();
                    const mouseX = e.clientX - rect.left;
                    const mouseY = e.clientY - rect.top;

                    // Update cursor glow position
                    cursorGlow.style.left = mouseX - 50 + 'px';
                    cursorGlow.style.top = mouseY - 50 + 'px';

                    // Dynamic glow intensity based on cursor distance from center
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    const deltaX = (mouseX - centerX) * 0.15;
                    const deltaY = (mouseY - centerY) * 0.15;
                    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                    const intensity = Math.min(distance / 50, 1);

                    gsap.to(cursorGlow, {
                        scale: 1 + intensity * 0.5,
                        opacity: 0.6 + intensity * 0.4,
                        duration: 0.2
                    });
                }
            });

            item.addEventListener('mouseleave', () => {
                isHovering = false;

                // Remove tilt event listeners
                item.removeEventListener('mousemove', handleTilt);
                item.removeEventListener('mousedown', handleMousedown);
                item.removeEventListener('mouseup', handleMouseup);

                // Reset tilt
                resetTilt();

                if (typeof gsap !== 'undefined') {
                    // Reset box shadow
                    gsap.to(item, {
                        boxShadow: 'var(--shadow-md)',
                        duration: 0.3
                    });

                    // Hide cursor glow
                    gsap.to(cursorGlow, {
                        opacity: 0,
                        scale: 1,
                        duration: 0.3
                    });
                }
            });

            // Click handler for lightbox (only for dedicated pages)
            if (!window.location.pathname.includes('/dashboard')) {
                item.addEventListener('click', () => {
                    const itemIndex = Array.from(portfolioItems).indexOf(item);
                    if (typeof lightboxController !== 'undefined') {
                        lightboxController.openLightbox(itemIndex);
                    }
                });
            }

            // Keyboard navigation
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    item.click();
                }
            });
        });
    }

    filterItems(items) {
        if (this.currentFilter === 'all') return items;
        return items.filter(item => item.category === this.currentFilter);
    }

    filterPortfolio(filter) {
        this.currentFilter = filter;

        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });

        // Animate filter transition
        const grid = document.getElementById('portfolioGrid');
        if (grid) {
            gsap.to(grid.children, {
                opacity: 0,
                y: 20,
                duration: 0.3,
                stagger: 0.05,
                onComplete: () => {
                    this.renderPortfolioItems();
                    gsap.fromTo(grid.children,
                        { opacity: 0, y: 20 },
                        { opacity: 1, y: 0, duration: 0.3, stagger: 0.05 }
                    );
                }
            });
        }
    }


    scrollToSection(target) {
        const element = document.querySelector(target);
        if (element) {
            const offset = 80; // Header height
            const elementPosition = element.offsetTop - offset;

            window.scrollTo({
                top: elementPosition,
                behavior: 'smooth'
            });
        }
    }

    updateActiveNav() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        const scrollY = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        // Animate theme transition
        if (typeof gsap !== 'undefined') {
            gsap.to('body', {
                backgroundColor: newTheme === 'dark' ? '#111827' : '#ffffff',
                duration: 0.3
            });
        }

        // Update theme toggle icon
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.setAttribute('aria-label',
                newTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
            );
        }
    }

    handleResize() {
        // Handle responsive adjustments
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    handleOnlineStatus(isOnline) {
        if (isOnline) {
            this.showNotification('Back online!', 'success');
        } else {
            this.showNotification('You are offline. Some features may not work.', 'warning');
        }
    }

    showNotification(message, type = 'info') {
        if (typeof animationController !== 'undefined') {
            animationController.animateNotification({
                textContent: message,
                className: `notification notification-${type}`
            });
        } else {
            // Simple notification fallback
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Mock API for demonstration - no stock images, only placeholder data
    async mockApiCall(endpoint, method = 'GET', data = null) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

        if (endpoint === '/api/portfolio') {
            if (method === 'GET') {
                return {
                    items: [
                        // No stock images - only Supabase PNG/MP4 files should be used
                    ]
                };
            } else if (method === 'POST') {
                // Simulate loading more items
                return {
                    items: [
                        // No additional stock images
                    ]
                };
            }
        }

        return { error: 'Endpoint not found' };
    }
}

// Utility functions
function scrollToSection(sectionId) {
    if (typeof mainController !== 'undefined') {
        mainController.scrollToSection(sectionId);
    }
}

function addToCart(productId, title, price) {
    if (typeof cartManager !== 'undefined') {
        cartManager.addPackage(productId, title, price);
    }
}

// Initialize main controller
const mainController = new MainController();

// Export for global use
window.MainController = MainController;
window.mainController = mainController;
}