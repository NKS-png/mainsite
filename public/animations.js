// Advanced Animations with GSAP & Lottie
class AnimationController {
    constructor() {
        this.init();
    }

    init() {
        this.registerGSAPPlugins();
        this.initScrollAnimations();
        this.initHeroAnimations();
        // this.initPreloader(); // Removed preloader
        this.initThemeToggle();
    }

    registerGSAPPlugins() {
        // Register ScrollTrigger if available
        if (typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }
    }

    initPreloader() {
        const preloader = document.getElementById('preloader');
        const progressFill = document.getElementById('progressFill');
        const brandAnimation = document.getElementById('brandAnimation');

        // Enhanced Lottie animation for brand
        if (typeof lottie !== 'undefined' && brandAnimation) {
            // Load the actual Lottie animation
            fetch('./lottie-preloader.json')
                .then(response => response.json())
                .then(animationData => {
                    const brandLottie = lottie.loadAnimation({
                        container: brandAnimation,
                        renderer: 'svg',
                        loop: true,
                        autoplay: true,
                        animationData: animationData
                    });

                    // Add GSAP animation to the Lottie container
                    gsap.fromTo(brandAnimation,
                        {
                            scale: 0,
                            rotation: -180,
                            opacity: 0
                        },
                        {
                            scale: 1,
                            rotation: 0,
                            opacity: 1,
                            duration: 1.2,
                            ease: "back.out(1.7)"
                        }
                    );
                })
                .catch(error => {
                    console.warn('Lottie animation failed to load, using fallback:', error);
                    // Fallback: simple CSS animation
                    brandAnimation.innerHTML = `
                        <div style="
                            width: 100%;
                            height: 100%;
                            background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            font-size: 2rem;
                            font-weight: bold;
                            animation: pulse-glow 2s ease-in-out infinite;
                        ">N</div>
                    `;
                });
        }

        // Enhanced loading progress with GSAP
        let progress = 0;
        const tl = gsap.timeline();

        const interval = setInterval(() => {
            progress += Math.random() * 25 + 10; // Faster progress increment
            if (progressFill) {
                gsap.to(progressFill, {
                    width: Math.min(progress, 100) + '%',
                    duration: 0.3,
                    ease: "power2.out"
                });
            }

            if (progress >= 100) {
                clearInterval(interval);

                // Completion animation
                tl.to(progressFill, {
                    background: "linear-gradient(90deg, #10b981, #34d399, #10b981)",
                    duration: 0.5,
                    ease: "power2.inOut"
                })
                .to('.loading-particles .particle', {
                    scale: 0,
                    opacity: 0,
                    duration: 0.3,
                    stagger: 0.1,
                    ease: "power2.in"
                }, "-=0.3")
                .to('.loading-text .loading-word', {
                    y: -20,
                    opacity: 0,
                    duration: 0.4,
                    stagger: 0.1,
                    ease: "power2.in"
                }, "-=0.2")
                .to(brandAnimation, {
                    scale: 0.8,
                    opacity: 0,
                    duration: 0.5,
                    ease: "power2.in"
                }, "-=0.3")
                .to(preloader, {
                    scale: 1.1,
                    opacity: 0,
                    duration: 0.8,
                    ease: "power2.inOut",
                    onComplete: () => {
                        preloader.style.display = 'none';
                        this.startHeroAnimations();
                    }
                });
            }
        }, 120);

        // Animate loading particles
        gsap.to('.loading-particles .particle', {
            y: 'random(-30, 30)',
            x: 'random(-30, 30)',
            rotation: 'random(-180, 180)',
            duration: 'random(2, 4)',
            ease: "none",
            repeat: -1,
            yoyo: true,
            stagger: 0.2
        });

        // Fallback: force complete preloader after 5 seconds
        setTimeout(() => {
            if (preloader && preloader.style.display !== 'none') {
                clearInterval(interval);
                progress = 100;
                if (progressFill) {
                    gsap.to(progressFill, {
                        width: '100%',
                        duration: 0.3,
                        ease: "power2.out"
                    });
                }
                setTimeout(() => {
                    gsap.to(preloader, {
                        scale: 1.1,
                        opacity: 0,
                        duration: 0.8,
                        ease: "power2.inOut",
                        onComplete: () => {
                            preloader.style.display = 'none';
                            this.startHeroAnimations();
                        }
                    });
                }, 500);
            }
        }, 5000);
    }


    initHeroAnimations() {
        // Start hero animations immediately since no preloader
        this.startHeroAnimations();
    }

    startHeroAnimations() {
        const heroTitle = document.querySelector('.hero-title');
        const heroSubtitle = document.querySelector('.hero-subtitle');
        const heroActions = document.querySelector('.hero-actions');
        const heroVisual = document.querySelector('.hero-visual');

        // Staggered entrance animations
        gsap.set([heroTitle, heroSubtitle, heroActions, heroVisual], {
            opacity: 0,
            y: 50
        });

        const tl = gsap.timeline();

        tl.to(heroTitle, {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out"
        })
        .to(heroSubtitle, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out"
        }, "-=0.5")
        .to(heroActions, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power3.out"
        }, "-=0.3")
        .to(heroVisual, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out"
        }, "-=0.4");
    }

    initScrollAnimations() {
        // Animate sections on scroll
        const sections = document.querySelectorAll('.portfolio-section, .store-section');

        sections.forEach(section => {
            gsap.set(section, { opacity: 0, y: 50 });

            if (typeof ScrollTrigger !== 'undefined') {
                ScrollTrigger.create({
                    trigger: section,
                    start: "top 80%",
                    end: "bottom 20%",
                    onEnter: () => {
                        gsap.to(section, {
                            opacity: 1,
                            y: 0,
                            duration: 1,
                            ease: "power3.out"
                        });
                    }
                });
            } else {
                // Fallback for when ScrollTrigger is not available
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            gsap.to(entry.target, {
                                opacity: 1,
                                y: 0,
                                duration: 1,
                                ease: "power3.out"
                            });
                        }
                    });
                }, { threshold: 0.1 });

                observer.observe(section);
            }
        });

        // Animate portfolio items with stagger
        const portfolioItems = document.querySelectorAll('.portfolio-item');

        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.create({
                trigger: '.portfolio-grid',
                start: "top 80%",
                onEnter: () => {
                    gsap.fromTo(portfolioItems,
                        {
                            opacity: 0,
                            y: 30,
                            scale: 0.9
                        },
                        {
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            duration: 0.6,
                            stagger: 0.1,
                            ease: "back.out(1.7)"
                        }
                    );
                }
            });
        }
    }

    initThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');

        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);

                // Animate theme transition
                gsap.to('body', {
                    backgroundColor: newTheme === 'dark' ? '#111827' : '#ffffff',
                    duration: 0.3
                });
            });
        }

        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    // Utility animation methods
    animateButtonClick(button) {
        gsap.to(button, {
            scale: 0.95,
            duration: 0.1,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut"
        });
    }

    animateHoverEffect(element, isHover) {
        gsap.to(element, {
            scale: isHover ? 1.05 : 1,
            y: isHover ? -4 : 0,
            duration: 0.3,
            ease: "power2.out"
        });
    }

    animateCardFlip(card, frontContent, backContent) {
        const tl = gsap.timeline();

        tl.to(card, {
            rotationY: 90,
            duration: 0.3,
            ease: "power2.in",
            onComplete: () => {
                frontContent.style.display = 'none';
                backContent.style.display = 'block';
            }
        })
        .to(card, {
            rotationY: 180,
            duration: 0.3,
            ease: "power2.out"
        });
    }

    animateNotification(notification) {
        gsap.fromTo(notification,
            {
                opacity: 0,
                y: -20,
                scale: 0.8
            },
            {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.4,
                ease: "back.out(1.7)"
            }
        );

        // Auto remove after 3 seconds
        setTimeout(() => {
            gsap.to(notification, {
                opacity: 0,
                y: -20,
                scale: 0.8,
                duration: 0.3,
                ease: "power2.in",
                onComplete: () => notification.remove()
            });
        }, 3000);
    }

    animateModalOpen(modal) {
        gsap.set(modal, { display: 'flex' });
        gsap.fromTo(modal,
            {
                opacity: 0,
                scale: 0.8
            },
            {
                opacity: 1,
                scale: 1,
                duration: 0.4,
                ease: "back.out(1.7)"
            }
        );
    }

    animateModalClose(modal) {
        gsap.to(modal, {
            opacity: 0,
            scale: 0.8,
            duration: 0.3,
            ease: "power2.in",
            onComplete: () => {
                modal.style.display = 'none';
            }
        });
    }

    animateLoadingSpinner(spinner) {
        gsap.to(spinner, {
            rotation: 360,
            duration: 1,
            repeat: -1,
            ease: "none"
        });
    }

    animateProgressBar(progressBar, progress) {
        gsap.to(progressBar, {
            width: progress + '%',
            duration: 0.5,
            ease: "power2.out"
        });
    }

    animateStaggeredList(items) {
        gsap.fromTo(items,
            {
                opacity: 0,
                x: -20
            },
            {
                opacity: 1,
                x: 0,
                duration: 0.4,
                stagger: 0.1,
                ease: "power2.out"
            }
        );
    }

    animateImageZoom(image, isZoom) {
        gsap.to(image, {
            scale: isZoom ? 1.2 : 1,
            duration: 0.5,
            ease: "power2.out"
        });
    }

    animateParallaxScroll() {
        // Parallax effect for hero background
        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.create({
                trigger: '.hero-section',
                start: "top bottom",
                end: "bottom top",
                onUpdate: (self) => {
                    const progress = self.progress;
                    gsap.set('.hero-visual', {
                        y: progress * -100
                    });
                }
            });
        }
    }

    animateTextReveal(textElement) {
        const text = textElement.textContent;
        textElement.innerHTML = text.split('').map(char =>
            `<span style="display: inline-block;">${char === ' ' ? '&nbsp;' : char}</span>`
        ).join('');

        const chars = textElement.querySelectorAll('span');

        gsap.fromTo(chars,
            {
                opacity: 0,
                y: 20
            },
            {
                opacity: 1,
                y: 0,
                duration: 0.05,
                stagger: 0.02,
                ease: "power2.out"
            }
        );
    }

    animateMagneticHover(element, strength = 0.3) {
        element.addEventListener('mousemove', (e) => {
            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const deltaX = (e.clientX - centerX) * strength;
            const deltaY = (e.clientY - centerY) * strength;

            gsap.to(element, {
                x: deltaX,
                y: deltaY,
                duration: 0.3,
                ease: "power2.out"
            });
        });

        element.addEventListener('mouseleave', () => {
            gsap.to(element, {
                x: 0,
                y: 0,
                duration: 0.5,
                ease: "elastic.out(1, 0.3)"
            });
        });
    }

    // Page transition animations
    animatePageTransition(fromPage, toPage, direction = 'forward') {
        const tl = gsap.timeline();

        // Exit animation
        tl.to(fromPage, {
            opacity: 0,
            y: direction === 'forward' ? -50 : 50,
            duration: 0.5,
            ease: "power2.in"
        });

        // Enter animation
        tl.fromTo(toPage,
            {
                opacity: 0,
                y: direction === 'forward' ? 50 : -50
            },
            {
                opacity: 1,
                y: 0,
                duration: 0.5,
                ease: "power2.out"
            }
        );

        return tl;
    }

    // Skeleton loading animations
    animateSkeletonLoader(skeleton) {
        const shimmer = skeleton.querySelector('.skeleton-shimmer') ||
                       skeleton.appendChild(document.createElement('div'));

        shimmer.className = 'skeleton-shimmer';
        shimmer.style.cssText = `
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
            animation: shimmer 1.5s infinite;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes shimmer {
                0% { left: -100%; }
                100% { left: 100%; }
            }
        `;
        document.head.appendChild(style);
    }

    // Performance monitoring
    monitorPerformance() {
        if ('performance' in window && 'getEntriesByType' in performance) {
            window.addEventListener('load', () => {
                const navigation = performance.getEntriesByType('navigation')[0];
                const paint = performance.getEntriesByType('paint');

                console.log('Page Load Time:', navigation.loadEventEnd - navigation.fetchStart);
                console.log('First Paint:', paint[0]?.startTime);
                console.log('First Contentful Paint:', paint[1]?.startTime);
            });
        }
    }

    // Initialize performance monitoring
    monitorPerformance();
}

// Global animation controller
const animationController = new AnimationController();

// Export for global use
window.AnimationController = AnimationController;
window.animationController = animationController;